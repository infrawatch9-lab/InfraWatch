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
    status: 200,
    description: 'Successful login',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expires_in: 3600
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
          password: 'newuserpassword123',
          role: 'USER',
          status: 'ACTIVE'
        }
      }
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    schema: {
      example: {
        access_token: 'your-jwt-access-token',
        refresh_token: 'your-jwt-refresh-token',
        expires_in: 3600,
        user: {
          id: 1,
          name: 'Zacarias Casimiro',
          email: 'user@example.com',
          role: 'USER',
          status: 'ACTIVE'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid registration data',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email already exists',
        error: 'Bad Request'
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
  description: 'Refresh token payload',
    schema: {
      example: {
        refreshToken: 'your-refresh-token'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        access_token: 'new-jwt-access-token',
        refresh_token: 'new-jwt-refresh-token',
        expires_in: 3600
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
        /*name: 'John Doe',
        email: 'user@example.com',
        role: 'USER',
        status: 'ACTIVE'*/
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
        message: 'Password has been reset successfully'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid payload or password',
    schema: {
      example: {
        statusCode: 400,
        message: 'Old password is incorrect',
        error: 'Bad Request'
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
        name: 'Updated Name',
        email: 'updateduser@example.com',
        role: 'USER',
        status: 'ACTIVE'
      }
    }
  })

  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid update payload',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid user data',
        error: 'Bad Request'
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
    description: 'Returns user data by ID',
    schema: {
      example: {
        id: 1,
        name: 'Zacarias Casimiro',
        email: 'user@example.com',
        role: 'USER',
        status: 'ACTIVE'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
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
    description: 'Returns a list of all users',
    schema: {
      example: [
        {
          id: 1,
          name: 'Zacarias Casimiro',
          email: 'user1@example.com',
          role: 'USER',
          status: 'ACTIVE'
        },
        {
          id: 2,
          name: 'Mariana John',
          email: 'user2@example.com',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      ]
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
        message: 'User deleted successfully',
        id: 1,
        name: 'Zacarias Casimiro',
        email: 'user1@example.com',
        role: 'USER',
        status: 'INACTIVE'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
