import { Controller, Post, Res, Req, HttpCode } from '@nestjs/common';
import { Response, Request } from 'express';

@Controller('auth')
export class LogoutController {
  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response, @Req() req: Request) {
    // Invalida o cookie (token) no frontend
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    // Opcional: req.logout() se usar passport
    return res.json({ message: 'Logout realizado com sucesso.' });
  }
}
