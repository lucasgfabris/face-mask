import { Controller, Post, Body, HttpException, HttpStatus, Req, Get } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    try {
      const ipAddress = request.ip || request.socket.remoteAddress;
      const userAgent = request.headers['user-agent'];

      const result = await this.authService.register(registerDto, ipAddress, userAgent);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro ao registrar usuário', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    try {
      const ipAddress = request.ip || request.socket.remoteAddress;
      const userAgent = request.headers['user-agent'];

      const result = await this.authService.login(loginDto, ipAddress, userAgent);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro ao autenticar usuário', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users')
  async getUsers() {
    try {
      const users = await this.authService.getAllUsers();
      return { success: true, users };
    } catch {
      throw new HttpException('Erro ao buscar usuários', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('logs')
  async getLogs() {
    try {
      const logs = await this.authService.getAuthLogs();
      return { success: true, logs };
    } catch {
      throw new HttpException('Erro ao buscar logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
