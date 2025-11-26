// src/modules/auth/strategies/ldap.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ldap from 'ldapjs';
import { promisify } from 'util';
import * as fs from 'fs';

export interface LdapUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  manager: string;
  memberOf: string[];
  dn: string;
  upn?: string;
}

/** Minimal RFC 4515 filter escaping */
function escapeLDAPFilter(value: string): string {
  return String(value).replace(/[\*\(\)\\\0]/g, (ch) => {
    switch (ch) {
      case '*': return '\\2a';
      case '(': return '\\28';
      case ')': return '\\29';
      case '\\': return '\\5c';
      case '\0': return '\\00';
      default: return ch;
    }
  });
}

/** Read attribute from entry.object (case-insensitive) with attributes[] fallback */
function readAttr(entry: any, key: string): string {
  const obj = entry?.object || {};
  const direct =
    (obj as any)[key] ??
    (obj as any)[key.toLowerCase?.()] ??
    (obj as any)[key.toUpperCase?.()];
  if (typeof direct === 'string') return direct;

  // attributes[] fallback (case-insensitive)
  try {
    const attrs = (entry as any).attributes as Array<{ type: string; vals: string[] }>;
    if (Array.isArray(attrs)) {
      for (const a of attrs) {
        if ((a?.type || '').toLowerCase() === key.toLowerCase()) {
          if (Array.isArray(a.vals) && a.vals.length) return String(a.vals[0]);
        }
      }
    }
  } catch {}
  return '';
}

@Injectable()
export class LdapService {
  constructor(private readonly config: ConfigService) {}

  private createClient() {
    const url = this.config.get<string>('AD_URL')!;
    const rejectUnauthorized = this.config.get<string>('AD_TLS_REJECT_UNAUTHORIZED') === 'true';

    // Prefer explicit CA (robust across shells/services)
    const caPath =
      this.config.get<string>('AD_CA_FILE') ||
      process.env.NODE_EXTRA_CA_CERTS ||
      '/usr/local/share/ca-certificates/EazyPay-RootCA.crt';

    const tlsOptions: Record<string, any> = { rejectUnauthorized };

    if (url?.toLowerCase().startsWith('ldaps://') && caPath && fs.existsSync(caPath)) {
      try {
        tlsOptions.ca = [fs.readFileSync(caPath)];
      } catch {
        // If read fails, proceed without explicit CA (will fail closed if rejectUnauthorized=true)
      }
    }

    return ldap.createClient({
      url,
      tlsOptions,
      timeout: 10000,
      connectTimeout: 10000,
    });
  }

  private async bind(client: ldap.Client, dn: string, password: string) {
    const bindAsync = promisify(client.bind).bind(client) as (dn: string, pw: string) => Promise<void>;
    await bindAsync(dn, password);
  }

  /** Fallback: fetch groups (including nested) where this DN is a member */
  private async searchGroupsByMember(client: ldap.Client, baseDN: string, userDn: string): Promise<string[]> {
    const filter = `(member:1.2.840.113556.1.4.1941:=${escapeLDAPFilter(userDn)})`;
    const opts: ldap.SearchOptions = {
      scope: 'sub',
      filter,
      attributes: ['distinguishedName', 'cn'],
      paged: false,
    };

    return await new Promise<string[]>((resolve, reject) => {
      const dns: string[] = [];
      client.search(baseDN, opts, (err, res) => {
        if (err) return reject(err);
        res.on('searchEntry', (entry) => {
          const dn =
            typeof (entry as any).dn === 'string'
              ? (entry as any).dn
              : (entry as any).dn?.toString?.() || (entry as any).object?.distinguishedName;
          if (dn) dns.push(dn);
        });
        res.on('error', reject);
        res.on('end', () => resolve(dns));
      });
    });
  }

  async authenticate(usernameRaw: string, passwordRaw: unknown): Promise<LdapUser> {
    const username = String(usernameRaw).trim();
    const password = typeof passwordRaw === 'string' ? passwordRaw : String(passwordRaw);
    if (!username || !password) throw new UnauthorizedException('Invalid credentials');

    const baseDN = this.config.get<string>('AD_BASE_DN')!;
    const bindDN = this.config.get<string>('AD_BIND_DN')!;
    const bindPW = this.config.get<string>('AD_BIND_PASSWORD')!;
    const defaultDomain = (this.config.get<string>('AD_DEFAULT_DOMAIN') || 'eazy.local').trim();

    const client = this.createClient();

    try {
      // 1) Bind as service account
      await this.bind(client, bindDN, bindPW);

      // 2) Search for the user (strict filter: user objects only, exclude disabled)
      const filter = `(&
        (sAMAccountName=${escapeLDAPFilter(username)})
        (objectCategory=person)
        (objectClass=user)
        (!(userAccountControl:1.2.840.113556.1.4.803:=2))
      )`.replace(/\s+/g, '');

      const searchOptions: ldap.SearchOptions = {
        scope: 'sub',
        filter,
        attributes: [
          'distinguishedName',
          'userPrincipalName',
          'mail',
          'givenName',
          'sn',
          'displayName',
          'cn',
          'manager',
          'memberOf',
          'sAMAccountName',
        ],
        sizeLimit: 2,
        paged: false,
      };

      // Keep the full entry to access entry.dn; attributes are on entry.object
      const searchAsync = () =>
        new Promise<any>((resolve, reject) => {
          client.search(baseDN, searchOptions, (err, res) => {
            if (err) return reject(err);
            const entries: any[] = [];
            res.on('searchEntry', (entry) => entries.push(entry));
            res.on('error', reject);
            res.on('end', () => {
              if (entries.length === 0) return reject(new UnauthorizedException('User not found'));
              if (entries.length > 1) return reject(new UnauthorizedException('Multiple users matched'));
              resolve(entries[0]);
            });
          });
        });

      const entry = await searchAsync();

      // DN from entry.dn (object or string) or attribute fallback
      const dnFromEntry =
        entry?.dn
          ? (typeof entry.dn === 'string' ? entry.dn : (entry.dn.toString ? entry.dn.toString() : ''))
          : '';
      const userDn: string = dnFromEntry || readAttr(entry, 'distinguishedName');
      if (!userDn) throw new UnauthorizedException('User DN not found in AD entry');

      const upn: string = readAttr(entry, 'userPrincipalName') || `${username}@${defaultDomain}`;

      // 3) Collect memberOf (including ranged forms & attributes array)
      const memberOfCollected = (() => {
        const vals: string[] = [];
        const obj = entry?.object || {};
        const keys = Object.keys(obj || {});
        for (const k of keys) {
          if (/^memberOf(;range=\d+-\d+|;range=\d+-\*)?$/i.test(k)) {
            const v: any = (obj as any)[k];
            if (Array.isArray(v)) vals.push(...v);
            else if (typeof v === 'string') vals.push(v);
          }
        }
        try {
          const attrs = (entry as any).attributes as Array<{ type: string; vals: string[] }>;
          if (Array.isArray(attrs)) {
            for (const a of attrs) {
              if (/^memberOf(;range=\d+-\d+|;range=\d+-\*)?$/i.test(a?.type || '')) {
                if (Array.isArray(a.vals)) vals.push(...a.vals);
              }
            }
          }
        } catch {}
        return vals;
      })();

      // 4) Fallback: nested groups via AD "in-chain" if nothing collected
      const memberOf = memberOfCollected.length > 0
        ? memberOfCollected
        : await this.searchGroupsByMember(client, baseDN, userDn);

      // 5) Re-bind as the user (verify credentials): try UPN then DN
      try {
        await this.bind(client, upn, password);
      } catch {
        await this.bind(client, userDn, password);
      }

      // --- Name resolution with fallbacks ---
      const rawGiven = readAttr(entry, 'givenName');
      const rawSn = readAttr(entry, 'sn');
      const rawDisplay = readAttr(entry, 'displayName');
      const rawCn = readAttr(entry, 'cn');

      let firstName = (rawGiven || '').trim();
      let lastName = (rawSn || '').trim();

      const deriveFromDisplayLike = (full: string) => {
        const s = (full || '').trim();
        if (!s) return { f: '', l: '' };
        const parts = s.split(/\s+/);
        if (parts.length === 1) return { f: parts[0], l: '' };
        return { f: parts[0], l: parts.slice(1).join(' ') };
      };

      if (!firstName && !lastName) {
        const fromDisplay = deriveFromDisplayLike(rawDisplay);
        firstName = fromDisplay.f;
        lastName = fromDisplay.l;
      }
      if (!firstName && !lastName) {
        const fromCn = deriveFromDisplayLike(rawCn);
        firstName = fromCn.f;
        lastName = fromCn.l;
      }

      const ldapUser: LdapUser = {
        username: readAttr(entry, 'sAMAccountName') || username,
        email: readAttr(entry, 'mail') || `${username}@${defaultDomain}`,
        firstName: firstName || '',
        lastName: lastName || '',
        manager: readAttr(entry, 'manager') || '',
        memberOf,
        dn: userDn,
        upn,
      };

      return ldapUser;
    } catch (err: any) {
      if (err?.name === 'UnauthorizedError' || err?.code === 49) {
        throw new UnauthorizedException('Invalid AD credentials');
      }
      throw new UnauthorizedException(err?.message || 'AD authentication failed');
    } finally {
      try { client.unbind(); } catch { /* noop */ }
    }
  }

  /**
   * Determine ALL roles from AD group membership
   * Returns array of role strings
   */
  determineRoles(memberOf: string[]): string[] {
    const norm = (s: string) => s.toUpperCase();
    const has = (dn: string, ...needles: string[]) => {
      const N = norm(dn);
      for (const n of needles) if (N.indexOf(n) !== -1) return true;
      return false;
    };
    
    const roles: string[] = [];
    
    for (const dn of memberOf || []) {
      if (has(dn, 'CN=HEADOFIT', 'CN=HEAD OF IT') && !roles.includes('head_of_it')) {
        roles.push('head_of_it');
      }
      if (has(dn, 'CN=ITOFFICER', 'CN=IT OFFICER') && !roles.includes('it_officer')) {
        roles.push('it_officer');
      }
      if (has(dn, 'CN=QAOFFICER', 'CN=QA OFFICER') && !roles.includes('qa_officer')) {
        roles.push('qa_officer');
      }
      if (has(dn, 'CN=HEADOFINFOSEC', 'CN=HEAD OF INFOSEC') && !roles.includes('head_of_infosec')) {
        roles.push('head_of_infosec');
      }
      if (has(dn, 'CN=LINEMANAGER', 'CN=LINE MANAGER') && !roles.includes('line_manager')) {
        roles.push('line_manager');
      }
      if (has(dn, 'CN=NOC') && !roles.includes('noc')) {
        roles.push('noc');
      }
    }
    
    // Everyone can be a requestor
    if (!roles.includes('requestor')) {
      roles.push('requestor');
    }
    
    return roles;
  }

  /**
   * Determine primary role (for backward compatibility)
   * Priority: head_of_it > head_of_infosec > line_manager > qa_officer > it_officer > noc > requestor
   */
  determineRole(memberOf: string[]): string {
    const roles = this.determineRoles(memberOf);
    
    // Return highest priority role
    const priorityOrder = ['head_of_it', 'head_of_infosec', 'line_manager', 'qa_officer', 'it_officer', 'noc', 'requestor'];
    
    for (const priorityRole of priorityOrder) {
      if (roles.includes(priorityRole)) {
        return priorityRole;
      }
    }
    
    return 'requestor';
  }
}
