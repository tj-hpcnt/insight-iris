import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    if (!request.session?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Add user to request object for easy access in controllers
    request.user = request.session.user;
    return true;
  }
}

@Injectable()
export class WriteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    if (!request.session?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (request.session.user.role !== 'write') {
      throw new UnauthorizedException('Write access required');
    }

    // Add user to request object for easy access in controllers
    request.user = request.session.user;
    return true;
  }
} 