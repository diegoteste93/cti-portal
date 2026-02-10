import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../database/entities';
import { Role, UserStatus } from '@cti/shared';
import { AuditService } from '../audit/audit.service';

interface GoogleTokenPayload {
  email: string;
  name: string;
  picture?: string;
  hd?: string;
  sub: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly allowedDomains: string[];

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    private auditService: AuditService,
  ) {
    this.googleClient = new OAuth2Client(
      config.get('GOOGLE_CLIENT_ID'),
      config.get('GOOGLE_CLIENT_SECRET'),
    );
    this.allowedDomains = (config.get('ALLOWED_DOMAINS', '') as string)
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  async validateGoogleToken(idToken: string): Promise<{ accessToken: string; user: User }> {
    let payload: GoogleTokenPayload;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get('GOOGLE_CLIENT_ID'),
      });
      const ticketPayload = ticket.getPayload();
      if (!ticketPayload || !ticketPayload.email) {
        throw new Error('Invalid token payload');
      }
      payload = {
        email: ticketPayload.email,
        name: ticketPayload.name || ticketPayload.email,
        picture: ticketPayload.picture,
        hd: ticketPayload.hd,
        sub: ticketPayload.sub,
      };
    } catch (err) {
      this.logger.warn(`Google token validation failed: ${err}`);
      throw new UnauthorizedException('Invalid Google token');
    }

    // Domain validation
    const emailDomain = payload.email.split('@')[1]?.toLowerCase();
    if (this.allowedDomains.length > 0) {
      if (!this.allowedDomains.includes(emailDomain)) {
        this.logger.warn(`Domain not allowed: ${emailDomain} for ${payload.email}`);
        await this.auditService.log(null, 'LOGIN_DENIED_DOMAIN', 'user', undefined, {
          email: payload.email,
          domain: emailDomain,
        });
        throw new UnauthorizedException('Email domain not authorized');
      }
      if (payload.hd && !this.allowedDomains.includes(payload.hd.toLowerCase())) {
        this.logger.warn(`HD claim not allowed: ${payload.hd} for ${payload.email}`);
        throw new UnauthorizedException('Organization domain not authorized');
      }
    }

    // JIT Provisioning
    let user = await this.userRepo.findOne({
      where: { email: payload.email },
      relations: ['groups'],
    });

    if (!user) {
      user = this.userRepo.create({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        role: Role.VIEWER,
        status: UserStatus.ACTIVE,
      });
      user = await this.userRepo.save(user);
      this.logger.log(`JIT provisioned user: ${payload.email}`);
      await this.auditService.log(user.id, 'USER_JIT_CREATED', 'user', user.id);
    } else if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.picture = payload.picture || user.picture;
    user.name = payload.name || user.name;
    await this.userRepo.save(user);

    await this.auditService.log(user.id, 'LOGIN_SUCCESS', 'user', user.id);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, user };
  }

  async devLogin(email: string): Promise<{ accessToken: string; user: User }> {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new UnauthorizedException('Dev login is disabled in production');
    }

    this.logger.warn(`DEV LOGIN used for: ${email}`);

    let user = await this.userRepo.findOne({
      where: { email },
      relations: ['groups'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Run seed first: npm run db:seed');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is deactivated');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    await this.auditService.log(user.id, 'DEV_LOGIN', 'user', user.id);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, user };
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
      relations: ['groups'],
    });
  }
}
