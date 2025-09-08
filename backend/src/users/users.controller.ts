import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Delete,
  HttpCode,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/roles.guard';
import {
  ResetPasswordDto,
  UpdateUserDto,
  CreateUserDto,
  LoginDto,
} from './user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post('logout')
  @HttpCode(200)
  async logout(@Res() res: Response, @Req() req: ExpressRequest) {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return res.json({ message: 'Logout realizado com sucesso.' });
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register user' })
  async registerWithTemporaryPassword(@Body() CreateUserDto: CreateUserDto) {
    return this.usersService.registerWithTemporaryPassword(CreateUserDto);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.usersService.refreshToken(body.refreshToken);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('reset-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(
    @Request() req: any,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(req.user.id, resetPasswordDto);
  }

  @Put('update-user')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user settings' })
  async updateUser(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(updateUserDto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }

  @Post('send-otp')
  @Public()
  @ApiOperation({ summary: 'Send OTP for password reset' })
  async sendOtp(@Body() body: { email: string }) {
    return this.usersService.generateOTP(body.email);
  }

  @Post('validate-otp')
  @Public()
  @ApiOperation({ summary: 'Validate OTP for password reset' })
  async validateOtp(@Body() body: { email: string; otp: string }) {
    return this.usersService.validateAndDeleteOTP(body.email, body.otp);
  }

  @Put('resetWithOtp')
  @Public()
  @ApiOperation({ summary: 'Validate OTP for password reset' })
  async resetPasswordWithOtp(@Body() body: { email: string; otp: string; newPassword: string}) {
    return this.usersService.resetPasswordWithOTP(body.email, body.otp, body.newPassword);
  }
}
