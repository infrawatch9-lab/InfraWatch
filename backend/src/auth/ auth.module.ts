import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret', // use env ou fallback
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [],
  exports: [JwtModule], // <- exporta o JwtModule para outros módulos
})
export class AuthModule {}
