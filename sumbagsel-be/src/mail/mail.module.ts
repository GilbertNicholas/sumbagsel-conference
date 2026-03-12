import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST', 'localhost'),
          port: configService.get<number>('SMTP_PORT', 587),
          secure: configService.get<string>('SMTP_SECURE', 'false') === 'true',
          auth:
            configService.get<string>('SMTP_USER') && configService.get<string>('SMTP_PASS')
              ? {
                  user: configService.get<string>('SMTP_USER'),
                  pass: configService.get<string>('SMTP_PASS'),
                }
              : undefined,
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM', 'noreply@sumbagsel2026.gkdi.org'),
        },
        template: {
          dir: join(__dirname, '..', '..', 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
