import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { UserSortableFields, UsersPaginationDto } from './dto/users-pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { createPaginatedResponse } from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const userData = {
      ...createUserDto,
      password: hashedPassword,
    };

    return this.usersRepository.create(userData);
  }

  async findAll(paginationDto: UsersPaginationDto): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, sortBy = UserSortableFields.CREATED_AT, sortOrder } = paginationDto;
    const [items, total] = await this.usersRepository.findUsers(page, limit, sortBy, sortOrder);
    return createPaginatedResponse(items, page, limit, total);
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.usersRepository.update(id, updateData);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(id);
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.usersRepository.update(id, { password: hashedNewPassword });
  }

  async remove(id: number, currentUser: User): Promise<void> {
    this.checkAccess(id, currentUser);
    await this.findById(id);
    return this.usersRepository.remove(id);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private checkAccess(resourceId: number, currentUser: User): void {
    const isOwner = currentUser.id === resourceId;
    const isAdmin = currentUser.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Access denied: You must be the owner or an admin');
    }
  }
}
