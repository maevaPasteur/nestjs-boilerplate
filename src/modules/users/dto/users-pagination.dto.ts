import { IsEnum, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export enum UserSortableFields {
  ID = 'id',
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class UsersPaginationDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserSortableFields, {
    message: `Sort field must be one of: ${Object.values(UserSortableFields).join(', ')}`
  })
  sortBy?: UserSortableFields = UserSortableFields.CREATED_AT;
}