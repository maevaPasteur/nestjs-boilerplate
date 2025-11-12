import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { PaginatedResponse } from "../../common/interfaces/pagination.interface";
import { UsersPaginationDto } from "../users/dto/users-pagination.dto";
import { createPaginatedResponse } from "../../common/utils/pagination.util";
import { UserSortableFields } from "../users/dto/users-pagination.dto";

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

  async getAllAdmins(paginationDto: UsersPaginationDto): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, sortBy = UserSortableFields.CREATED_AT, sortOrder } = paginationDto;
    const [items, total] = await this.usersRepository.findAdminsPaginated(page, limit, sortBy, sortOrder);
    return createPaginatedResponse(items, page, limit, total);
  }

  async deleteAdmin(id: number): Promise<void> {
    const user = await this.usersService.findById(id);
    
    if (user.role !== UserRole.ADMIN) {
      throw new BadRequestException('User is not an admin');
    }

    return this.usersService.remove(id);
  }
}