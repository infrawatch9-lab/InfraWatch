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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto, LoginDto, ResetPasswordDto, UpdateUserDto } from './user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'User login' })
  @ApiBody({
    description: 'User login credentials',
    type: LoginDto,
    examples: {
      default: {
        summary: 'Default login example',
        value: {
          email: 'user@example.com',
          password: 'yourpassword123'
        }
      },
      adminLogin: {
        summary: 'Admin login example',
        value: {
          email: 'admin@example.com',
          password: 'adminpassword123'
        }
      }
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Successful login',
    schema: {
      example: {
          "success": true,
          "message": "Login realizado! ATENÇÃO: Você deve alterar sua senha provisória.",
          "user": {
            "id": 5,
            "name": "Zacarias Casimiro",
            "email": "zacarias@gmail.com",
            "role": "USER",
            "status": "ACTIVE",
            "isTemporaryPassword": true,
            "temporaryPasswordExpiry": "2025-08-19T15:01:50.731Z",
            "createdAt": "2025-08-18T15:01:50.732Z",
            "updatedAt": "2025-08-18T15:01:50.732Z"
          },
          "tokens": {
            "accessToken": "eyJhbGciOiJIUHI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidXNlcklkIjo1LCJlbWFpbCI6InphY2FyaWFzLm5hdHhvLjM5QGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwibmFtZSI6IlphY2FyaWFzIENhc2ltaXJvIiwic3RhdHVzIjoiQUNUSVZFIiwiaWF0IjoxNzU1NTI5NDE4LCJleHAiOjE3NTU2MTU4MTh9.FCrKLYp60VNwxZjmkXVvRtGEsVcMHlCpR_Fw4w5bpA4",
            "refreshToken": "eyJhbGciOiJIUzl1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzU1NTI5NDE4LCJleHAiOjE3NTYxMzQyMTh9.6YYTS4rUqIcnXoOHidCBt7cdBsr0a0IkmCDK_c6qiKo",
            "expiresIn": 86400
          }
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register user (Admin only)' })
   @ApiBody({
    description: 'User registration data',
    type: CreateUserDto,
    examples: {
      default: {
        summary: 'Default registration example',
        value: {
          name: 'New User',
          email: 'newuser@example.com',
          role: 'USER',
        }
      }
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
          "success": true,
          "message": "Conta criada com sucesso! Verifique seu email para a senha provisória.",
          "user": {
            "id": 4,
            "name": "Victor Leonel",
            "email": "20221987@colitions.co.ao",
            "role": "USER",
            "status": "ACTIVE",
            "isTemporaryPassword": true,
            "temporaryPasswordExpiry": "2025-08-19T14:17:36.566Z",
            "createdAt": "2025-08-18T14:17:36.569Z",
            "updatedAt": "2025-08-18T14:17:36.569Z"
          }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid registration data',
    schema: {
      example: {
        "success": false,
        "message": "Usuário já existe com este email"
      }
    }
  })
  async registerWithTemporaryPassword(@Body() CreateUserDto: CreateUserDto) {
    return this.usersService.registerWithTemporaryPassword(CreateUserDto);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiBody({
    description: 'Refresh token data',
    type: Object,
    examples: {
      default: {
        summary: 'Default refresh token example',
        value: {
          refreshToken: 'your-refresh-token-here'
        }
      }
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
          success: true,
          message: "Token renovado com sucesso",
          tokens: {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI8IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJlbWFpbCI6Imdrb21iYWRldkBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiREVWIiwic3RhdHVzIjoiQUNUSVZFIiwiaWF0IjoxNzU1NTI4NDg4LCJleHAiOjE3NTU2MTQ4ODh9.93Q-_CpnHHHJUJ287LJ9FBuaG8J6GwFeSiVE90L_Hp8",
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ4.eyJ1c2VySWQiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzU1NTI4NDg4LCJleHAiOjE3NTYxMzMyODh9.0G3g_fx31lYlFTuxTB8LrMcv0g2ljqXrR9f-aIuoekE",
            expiresIn: 86400
          }
        }
      }
  })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.usersService.refreshToken(body.refreshToken);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile',
    schema: {
      example: {
        id: 1,
        name: 'John Doe',
        email: 'Doejohn@example.com',
        role: 'USER',
        createdAt: "2025-08-13T18:59:05.798Z",
        updatedAt: "2025-08-13T19:00:07.873Z"
      }
    }
  })
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('reset-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset user password' })
    @ApiBody({
    description: 'Payload to reset password',
    type: ResetPasswordDto,
    examples: {
      default: {
        summary: 'Reset password example',
        value: {
          currentPassword: 'currentPassword123',
          newPassword: 'newSecurePassword456'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: {
          "success": true,
          "message": "Senha alterada com sucesso"
      }
    }
  })
  async resetPassword(@Request() req: any, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(req.user.id, resetPasswordDto);
  }

  @Put('update-user')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user settings' })
    @ApiBody({
    description: 'Payload to update user settings',
    type: UpdateUserDto,
    examples: {
      default: {
        summary: 'Update user example',
        value: {
          name: 'Updated Name',
          email: 'updateduser@example.com',
          role: 'USER',
          isTemporaryPassword: false,
          status: 'ACTIVE'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'John Doe',
        email: 'Doejohn@example.com',
        role: 'USER',
        createdAt: "2025-08-13T18:59:05.798Z",
        updatedAt: "2025-08-13T19:00:07.873Z"
      }
    }
  })
  async updateUser(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.id, updateUserDto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'John Doe',
        email: 'Doejohn@example.com',
        role: 'USER',
        createdAt: "2025-08-13T18:59:05.798Z",
        updatedAt: "2025-08-13T19:00:07.873Z"
      }
    }
  })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        users: [
          {
            "id": 1,
            "name": "Ola Mundo",
            "email": "olamundo@gmail.com",
            "role": "ADMIN",
            "createdAt": "2025-08-18T13:24:34.003Z",
            "updatedAt": "2025-08-18T13:26:07.680Z"
          },
          {
            "id": 2,
            "name": "Hello World",
            "email": "helloworld@gmail.com",
            "role": "ADMIN",
            "createdAt": "2025-08-18T13:34:30.585Z",
            "updatedAt": "2025-08-18T13:34:30.585Z"
          },
          {
            "id": 5,
            "name": "Victor Leonel",
            "email": "intra@isptec.co.ao",
            "role": "USER",
            "createdAt": "2025-08-18T14:17:36.569Z",
            "updatedAt": "2025-08-18T14:17:36.569Z"
          },
        ]
      }
    }
  })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        "success": true,
        "message": "Usuário deletado com sucesso"
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - Only admins can delete users',
    schema: {
      example: {
        "message": "Acesso negado: papel insuficiente",
        "error": "Forbidden",
        "statusCode": 403
      }
    }
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
