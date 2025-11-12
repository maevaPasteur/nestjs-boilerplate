import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    const ownershipParam = this.reflector.get<string>(
      'ownershipParam',
      context.getHandler()
    ) || 'id';

    const resourceId = params[ownershipParam];

    if (!user || !resourceId) {
      throw new ForbiddenException('Access denied');
    }

    if (user.id !== resourceId && user.id !== parseInt(resourceId)) {
      throw new ForbiddenException('You can only modify your own resources');
    }

    return true;
  }
}