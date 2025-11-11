import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export type SortOrder = 'ASC' | 'DESC';

export class SortOrderDto {
  @IsOptional()
  @IsString({ message: 'sortBy must be a string' })
  @MaxLength(100, { message: `sortBy can't exceed 100 characters` })
  sortBy: string = 'createdAt';

  @IsOptional()
  @Transform(({ value }) => (value ? String(value).toUpperCase() : undefined))
  @IsIn(['ASC', 'DESC'], { message: 'order must be "asc" or "desc"' })
  order: SortOrder = 'DESC';
}
