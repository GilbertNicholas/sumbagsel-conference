import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Only initialize if credentials are provided
    if (!clientID || !clientSecret || !callbackURL) {
      // Return a dummy strategy that will fail gracefully
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL: 'http://localhost:3000/api/auth/google/callback',
        scope: ['email', 'profile'],
      });
    } else {
      super({
        clientID,
        clientSecret,
        callbackURL,
        scope: ['email', 'profile'],
      });
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('Email not provided by Google'), false);
    }

    const user = await this.authService.validateOrCreateGoogleUser({
      googleId: id,
      email,
      firstName: name?.givenName,
      lastName: name?.familyName,
    });

    return done(null, user);
  }
}

