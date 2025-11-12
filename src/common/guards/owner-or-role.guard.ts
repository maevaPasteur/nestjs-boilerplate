import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from "../../modules/users/entities/user.entity";

@Injectable()
export class OwnerOrRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>('allowedRoles', [
      context.getHandler(),
      context.getClass(),
    ]) || [UserRole.ADMIN];

    const hasRequiredRole = allowedRoles.some(role =>
      user.roles?.includes(role)
    );

    if (hasRequiredRole) {
      return true;
    }

    const ownershipField = this.reflector.get<string>('ownershipField', context.getHandler()) || 'id';
    const resourceId = request.params[ownershipField];

    return user.id === resourceId || user.id === parseInt(resourceId);
  }
}