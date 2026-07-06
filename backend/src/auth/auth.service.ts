import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { MfaLoginDto } from './dto/mfa-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { RegisterDto } from './dto/register.dto';
import type { Request } from 'express';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

const captchaStore = new Map<string, string>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,

    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,

    private readonly jwtService: JwtService,
  ) {}

  generateCaptcha() {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;

    const captchaId = uuidv4();
    const answer = String(a + b);

    captchaStore.set(captchaId, answer);

    setTimeout(() => {
      captchaStore.delete(captchaId);
    }, 5 * 60 * 1000);

    return {
      captchaId,
      question: `¿Cuánto es ${a} + ${b}?`,
      expiresIn: 300,
    };
  }

  private generateAccessToken(user: User) {
    const payload = {
      sub: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'SecureWalletSuperSecret2026',
      expiresIn: '15m',
    });
  }

  private async createRefreshToken(user: User) {
    const refreshToken = uuidv4();
    const tokenHash = await bcrypt.hash(refreshToken, 12);

    await this.refreshRepo.save({
      tokenHash,
      familyId: uuidv4(),
      userId: user.id,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return refreshToken;
  }

  async register(dto: RegisterDto, req: Request) {
    const expectedAnswer = captchaStore.get(dto.captchaId);

    if (!expectedAnswer) {
      throw new BadRequestException('CAPTCHA inválido o expirado');
    }

    if (expectedAnswer !== dto.captchaAnswer) {
      throw new BadRequestException('Respuesta CAPTCHA incorrecta');
    }

    captchaStore.delete(dto.captchaId);

    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { ci: dto.ci }, { phone: dto.phone }],
    });

    if (exists) {
      throw new BadRequestException('El usuario ya existe');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      uuid: uuidv4(),
      fullName: dto.fullName,
      ci: dto.ci,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });

    const savedUser = await this.userRepo.save(user);

    const wallet = this.walletRepo.create({
      uuid: uuidv4(),
      balance: 0,
      user: savedUser,
      userId: savedUser.id,
    });

    await this.walletRepo.save(wallet);

    await this.auditRepo.save({
      action: 'REGISTER',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      user: savedUser,
      userId: savedUser.id,
      metadata: {
        email: savedUser.email,
      },
    });

    return {
      message: 'Usuario registrado correctamente',
      user: {
        uuid: savedUser.uuid,
        fullName: savedUser.fullName,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
      },
      wallet: {
        uuid: wallet.uuid,
        balance: wallet.balance,
      },
    };
  }

  async login(dto: LoginDto, req: Request) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Credenciales inválidas');
    }

    if (user.isBlocked && user.blockedUntil && user.blockedUntil > new Date()) {
      throw new BadRequestException('Cuenta bloqueada temporalmente');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordOk) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.isBlocked = true;
        user.blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.userRepo.save(user);

      await this.auditRepo.save({
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: user.id,
        metadata: { email: user.email },
      });

      throw new BadRequestException('Credenciales inválidas');
    }

    user.failedLoginAttempts = 0;
    user.isBlocked = false;
    user.blockedUntil = null;

    if (!user.mfaSecret || !user.mfaEnabled) {
      const secret = speakeasy.generateSecret({
        name: `SecureWallet (${user.email})`,
        issuer: 'SecureWallet',
        length: 20,
      });

      user.mfaSecret = secret.base32;
      user.mfaEnabled = false;

      await this.userRepo.save(user);

      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

      await this.auditRepo.save({
        action: 'MFA_SETUP_REQUIRED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
        },
      });

      return {
        message: 'Configura MFA para continuar',
        mfaSetupRequired: true,
        email: user.email,
        userUuid: user.uuid,
        qrCodeUrl,
        manualCode: secret.base32,
      };
    }

    await this.userRepo.save(user);

    return {
      message: 'MFA requerido',
      mfaRequired: true,
      email: user.email,
      userUuid: user.uuid,
    };
  }

  async enableMfa(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const secret = speakeasy.generateSecret({
      name: `SecureWallet (${user.email})`,
      issuer: 'SecureWallet',
      length: 20,
    });

    user.mfaSecret = secret.base32;
    user.mfaEnabled = false;

    await this.userRepo.save(user);

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    await this.auditRepo.save({
      action: 'MFA_ENABLE_REQUESTED',
      userId: user.id,
      metadata: {
        email: user.email,
      },
    });

    return {
      message: 'Escanea el QR con Google Authenticator y luego verifica el código',
      qrCodeUrl,
      manualCode: secret.base32,
    };
  }

  async verifyMfa(userId: number, code: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA no fue inicializado');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Código MFA inválido');
    }

    user.mfaEnabled = true;
    await this.userRepo.save(user);

    await this.auditRepo.save({
      action: 'MFA_ENABLED',
      userId: user.id,
      metadata: {
        email: user.email,
      },
    });

    return {
      message: 'MFA activado correctamente',
      mfaEnabled: true,
    };
  }

  async mfaLogin(dto: MfaLoginDto, req: Request) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Credenciales inválidas');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA no fue inicializado para este usuario');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: dto.code,
      window: 2,
    });

    if (!verified) {
      await this.auditRepo.save({
        action: 'MFA_LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: user.id,
        metadata: {
          email: user.email,
        },
      });

      throw new BadRequestException('Código MFA inválido');
    }

    if (!user.mfaEnabled) {
      user.mfaEnabled = true;
      await this.userRepo.save(user);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);

    await this.auditRepo.save({
      action: 'MFA_LOGIN_SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return {
      message: 'Login MFA correcto',
      accessToken,
      refreshToken,
      user: {
        uuid: user.uuid,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string, req: Request) {
    const tokens = await this.refreshRepo.find({
      relations: {
        user: true,
      },
    });

    let matchedToken: RefreshToken | null = null;

    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);

      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (
      matchedToken.revoked ||
      matchedToken.used ||
      matchedToken.expiresAt < new Date()
    ) {
      await this.refreshRepo.update(
        { familyId: matchedToken.familyId },
        { revoked: true },
      );

      throw new UnauthorizedException(
        'Refresh token reutilizado o expirado. Sesión revocada.',
      );
    }

    matchedToken.used = true;
    matchedToken.revoked = true;
    await this.refreshRepo.save(matchedToken);

    const newRefreshToken = uuidv4();
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 12);

    await this.refreshRepo.save({
      tokenHash: newRefreshHash,
      familyId: matchedToken.familyId,
      userId: matchedToken.userId,
      user: matchedToken.user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const accessToken = this.generateAccessToken(matchedToken.user);

    await this.auditRepo.save({
      action: 'TOKEN_REFRESH',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: matchedToken.userId,
      metadata: {
        email: matchedToken.user.email,
      },
    });

    return {
      message: 'Token renovado correctamente',
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: number, refreshToken: string, req: Request) {
    const tokens = await this.refreshRepo.find({
      where: {
        userId,
      },
    });

    let matchedToken: RefreshToken | null = null;

    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);

      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.refreshRepo.update(
      { familyId: matchedToken.familyId },
      { revoked: true },
    );

    await this.auditRepo.save({
      action: 'LOGOUT',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId,
      metadata: {
        familyId: matchedToken.familyId,
      },
    });

    return {
      message: 'Sesión cerrada correctamente',
    };
  }
}