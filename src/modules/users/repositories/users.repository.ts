import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { SortOrder } from "../../../common/dto/pagination-query.dto";
import { UserSortableFields } from '../dto/users-pagination.dto';

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: UserSortableFields;
  sortOrder?: SortOrder;
}

interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  email?: string;
}

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findUsers(
    page: number,
    limit: number,
    sortBy: UserSortableFields = UserSortableFields.CREATED_AT,
    sortOrder: SortOrder = SortOrder.DESC
  ): Promise<[User[], number]> {
    return this.findPaginatedWithFilters({ page, limit, sortBy, sortOrder });
  }

  async findAdmins(
    page: number,
    limit: number,
    sortBy: UserSortableFields = UserSortableFields.CREATED_AT,
    sortOrder: SortOrder = SortOrder.DESC
  ): Promise<[User[], number]> {
    return this.findPaginatedWithFilters(
      { page, limit, sortBy, sortOrder },
      { role: UserRole.ADMIN }
    );
  }

  private async findPaginatedWithFilters(
    options: PaginationOptions,
    filters: UserFilters = {}
  ): Promise<[User[], number]> {
    const { page, limit, sortBy = UserSortableFields.CREATED_AT, sortOrder = SortOrder.DESC } = options;
    
    const findOptions: FindManyOptions<User> = {
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
    };

    if (Object.keys(filters).length > 0) {
      findOptions.where = filters;
    }

    return this.userRepository.findAndCount(findOptions);
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    await this.userRepository.restore(id);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async findByRolePaginated(
    role: UserRole,
    page: number,
    limit: number,
    sortBy: UserSortableFields = UserSortableFields.CREATED_AT,
    sortOrder: SortOrder = SortOrder.DESC
  ): Promise<[User[], number]> {
    return this.findPaginatedWithFilters(
      { page, limit, sortBy, sortOrder },
      { role }
    );
  }

  async findActiveUsersPaginated(
    page: number,
    limit: number,
    sortBy: UserSortableFields = UserSortableFields.CREATED_AT,
    sortOrder: SortOrder = SortOrder.DESC
  ): Promise<[User[], number]> {
    return this.findPaginatedWithFilters(
      { page, limit, sortBy, sortOrder },
      { isActive: true }
    );
  }
}