import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '../admin.service';
import { Admin } from '../../entities/admin.entity';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private configService: ConfigService,
    private adminService: AdminService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'change-me',
    });
  }

  async validate(payload: any): Promise<Admin> {
    // Check if payload has admin role
    if (payload.role !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.adminService.validateAdmin(payload.sub);
    if (!admin) {
      throw new UnauthorizedException('Admin not found or inactive');
    }
    return admin;
  }
}
