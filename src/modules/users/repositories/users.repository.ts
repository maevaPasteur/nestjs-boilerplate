import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';

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

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
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

  async findAllPaginated(paginationDto: any, options?: any) {
    return this.userRepository.findAndCount({
      ...options,
      skip: paginationDto.skip,
      take: paginationDto.take,
    });
  }
}