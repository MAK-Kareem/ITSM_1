import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ldap from 'ldapjs';
import * as fs from 'fs';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get('ldap')
  async checkLdap() {
    const url = this.config.get<string>('AD_URL')!;
    const bindDN = this.config.get<string>('AD_BIND_DN')!;
    const bindPW = this.config.get<string>('AD_BIND_PASSWORD')!;
    const rejectUnauthorized = this.config.get<string>('AD_TLS_REJECT_UNAUTHORIZED') === 'true';
    const caPath =
      this.config.get<string>('AD_CA_FILE') ||
      process.env.NODE_EXTRA_CA_CERTS ||
      '/usr/local/share/ca-certificates/EazyPay-RootCA.crt';

    const tlsOptions: Record<string, any> = { rejectUnauthorized };
    if (url.toLowerCase().startsWith('ldaps://') && caPath && fs.existsSync(caPath)) {
      tlsOptions.ca = [fs.readFileSync(caPath)];
    }

    const client = ldap.createClient({ url, tlsOptions, timeout: 5000, connectTimeout: 5000 });

    return new Promise((resolve) => {
      client.bind(bindDN, bindPW, (err) => {
        if (err) {
          resolve({ status: 'unhealthy', error: err.message });
        } else {
          resolve({ status: 'healthy', timestamp: new Date().toISOString() });
        }
        client.unbind();
      });
    });
  }
}
