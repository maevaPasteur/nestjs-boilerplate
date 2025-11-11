import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { RegisterAdminDto } from './dtos/register-admin.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResult, PaginationMeta } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async registerAdmin(registerAdminDto: RegisterAdminDto): Promise<User> {
    const createUserData = {
      ...registerAdminDto,
      role: UserRole.ADMIN,
    };

    return this.usersService.create(createUserData);
  }

  async getAllAdmins(): Promise<User[]> {
    return this.usersRepository.findByRole(UserRole.ADMIN);
  }

  async getAllUsersPaginated(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
    const [data, total] = await this.usersRepository.findAllPaginated(paginationDto);
    const meta = new PaginationMeta(total, paginationDto.page!, paginationDto.limit!);
    
    return {
      data,
      meta,
    };
  }

  async deleteAdmin(id: number): Promise<void> {
    const user = await this.usersService.findById(id);
    
    if (user.role !== UserRole.ADMIN) {
      throw new BadRequestException('User is not an admin');
    }

    return this.usersService.remove(id);
  }
}