import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, Get, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login-ad')
  @HttpCode(HttpStatus.OK)
  async loginAD(@Body() loginDto: { username: string; password: string }) {
    console.log('=== AD Login Attempt ===');
    console.log('Username:', loginDto.username);
    console.log('Password provided:', !!loginDto.password);
    console.log('Password type:', typeof loginDto.password);
    console.log('Password length:', loginDto.password?.length);
    console.log('Timestamp:', new Date().toISOString());

    if (!loginDto.username || !loginDto.password) {
      throw new BadRequestException('Username and password are required');
    }

    if (typeof loginDto.password !== 'string') {
      throw new BadRequestException('Password must be a string');
    }

    if (loginDto.password.trim() === '') {
      throw new BadRequestException('Password cannot be empty');
    }

    try {
      const result = await this.authService.loginWithAD(
        loginDto.username.trim(),
        loginDto.password
      );
      console.log('AD Login Success:', loginDto.username);
      return result;
    } catch (error) {
      console.error('AD Login Failed:', error.message);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email: string; password: string }) {
    console.log('Local login attempt for:', loginDto.email);
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Get('users/it-managers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users who are members of ITManager AD group' })
  async getITManagers() {
    return this.authService.getITManagers();
  }
}
