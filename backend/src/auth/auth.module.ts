import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard, WriteGuard } from './auth.guard';

@Module({
  providers: [AuthService, AuthGuard, WriteGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, WriteGuard],
})
export class AuthModule {} 