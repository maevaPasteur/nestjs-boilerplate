import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  ValidationPipe, UseGuards,
} from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorators";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) registerDto: RegisterDto,
  ): Promise<User> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) loginDto: LoginDto,
  ): Promise<AuthTokens> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthTokens> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any): Promise<User> {
    return user;
  }
}
