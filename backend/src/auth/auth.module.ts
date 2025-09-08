import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';

import { LogoutController } from './logout.controller';
import { CheckcleAuthModule } from './checkCle/checkcle-auth.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret', // use env ou fallback
      signOptions: { expiresIn: '1h' },
    }),
    CheckcleAuthModule,
  ],
  controllers: [LogoutController],
  providers: [],
  exports: [JwtModule, CheckcleAuthModule], // <- exporta o JwtModule e CheckcleAuthModule para outros módulos
})
export class AuthModule {}
