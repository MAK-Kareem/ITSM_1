import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { LdapService } from './strategies/ldap.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly ldapService: LdapService,
  ) {}

  /**
   * Extract CN (Common Name) from LDAP Distinguished Name
   * Example: "CN=ITManager,OU=Security Groups,DC=eazy,DC=local" -> "ITManager"
   */
  private extractCN(dn: string): string {
    const match = dn.match(/CN=([^,]+)/i);
    return match ? match[1] : dn;
  }

  /**
   * Convert AD memberOf array to comma-separated CN values
   * This keeps the department field under the character limit
   */
  private formatMemberOf(memberOf: string[] | undefined): string {
    if (!memberOf || memberOf.length === 0) {
      return '';
    }

    // Extract only CN values and join with comma
    const cnValues = memberOf.map(dn => this.extractCN(dn));
    return cnValues.join(',');
  }

  /**
   * Active Directory login
   * - Authenticate against AD
   * - Upsert local user (no local password for AD users)
   * - Issue JWT with roles (array from AD groups) + role (primary) + roleId (numeric from DB if present)
   */
  async loginWithAD(username: string, password: string) {
    // AD authenticate first (throws 401 if invalid)
    const ldapUser = await this.ldapService.authenticate(username, password);
    const rolesFromAd = this.ldapService.determineRoles(ldapUser.memberOf);
    const primaryRole = this.ldapService.determineRole(ldapUser.memberOf);

    // Upsert local user record
    let user = await this.userRepository.findOne({ where: { username: ldapUser.username } });

    if (!user) {
      user = this.userRepository.create({
        username: ldapUser.username,
        email: ldapUser.email,
        firstName: ldapUser.firstName || null,
        lastName: ldapUser.lastName || null,
        // For AD users, no local password is used; keep NOT NULL satisfied with empty string.
        passwordHash: '',
        isActive: true,
        isVerified: true,
        lastLogin: new Date(),
        // Store AD groups in department field - extract CN only to avoid length issues
        department: this.formatMemberOf(ldapUser.memberOf),
      } as User);
    } else {
      user.email = ldapUser.email || user.email;
      user.firstName = ldapUser.firstName || user.firstName;
      user.lastName = ldapUser.lastName || user.lastName;
      user.lastLogin = new Date();
      // Update AD groups - extract CN only
      user.department = this.formatMemberOf(ldapUser.memberOf);
    }

    await this.userRepository.save(user);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: primaryRole,           // string - primary role for backward compatibility
      roles: rolesFromAd,          // array of all roles from AD groups
      roleId: user.roleId ?? null  // numeric role id if your app uses it elsewhere
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        role: primaryRole,
        roles: rolesFromAd,
        roleId: user.roleId ?? null,
      },
    };
  }

  /**
   * Local registration (non-AD)
   */
  async register(userData: any) {
    const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const username = userData.email.split('@')[0];
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      username,
      email: userData.email,
      passwordHash: hashedPassword,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      isActive: true,
      isVerified: false,
    } as User);

    const savedUser = await this.userRepository.save(user);
    const { passwordHash, ...result } = savedUser as any;
    return result;
  }

  /**
   * Local login (email/password against DB)
   */
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    // No user or no local password set
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId ?? null,
      roles: ['requestor'], // Default role for local users
      role: 'requestor',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        roleId: user.roleId ?? null,
        roles: ['requestor'],
        role: 'requestor',
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * Get all active users (for Asset Owner and Assigned To dropdowns)
   */
  async getAllUsers(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'department'],
      order: { firstName: 'ASC', lastName: 'ASC' }
    });

    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      department: user.department ?? '',
    }));
  }

  /**
   * Get users who are members of ITManager AD group
   * (for Asset Manager dropdown)
   */
  async getITManagers(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'department'],
    });

    // Filter users whose department field contains ITManager group
    // Now checking for CN values only (e.g., "ITManager" instead of full DN)
    const itManagers = users.filter(user => {
      const groups = user.department?.toUpperCase() || '';
      return groups.includes('ITMANAGER') || groups.includes('IT MANAGER');
    });

    return itManagers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    }));
  }
}
