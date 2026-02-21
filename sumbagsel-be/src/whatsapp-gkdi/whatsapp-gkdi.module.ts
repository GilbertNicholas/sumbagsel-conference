import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsappGkdiService } from './whatsapp-gkdi.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
  ],
  providers: [WhatsappGkdiService],
  exports: [WhatsappGkdiService],
})
export class WhatsappGkdiModule {}
