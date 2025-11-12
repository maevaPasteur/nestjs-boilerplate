import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min, IsString, Matches, IsEnum } from "class-validator";

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({message: 'Page must be an integer'})
  @Min(1, {message: 'Page must be at least 1'})
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({message: 'Limit must be an integer'})
  @Min(1, {message: 'Limit must be at least 1'})
  @Max(100, {message: `Limit can't exceed 100`})
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Sort field must contain only letters, numbers and underscores'
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'Sort order must be either ASC or DESC'
  })
  sortOrder?: SortOrder = SortOrder.DESC;
}