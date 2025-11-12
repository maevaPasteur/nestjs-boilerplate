import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersPaginationDto } from '../users/dto/users-pagination.dto';
import { PaginatedResponse } from "../../common/interfaces/pagination.interface";

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerAdmin(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    registerAdminDto: RegisterAdminDto,
  ): Promise<User> {
    return this.adminService.registerAdmin(registerAdminDto);
  }

  @Get('users')
  async getAllUsers(
    @Query() paginationQuery: UsersPaginationDto
  ): Promise<PaginatedResponse<User>> {
    return this.adminService.getAllAdmins(paginationQuery);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdmin(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminService.deleteAdmin(id);
  }
}