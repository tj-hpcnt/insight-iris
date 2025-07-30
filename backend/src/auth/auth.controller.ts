import { Controller, Post, Get, Body, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

interface LoginDto {
  username: string;
  password: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { username, password } = loginDto;
    
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    req.session.user = user;
    
    res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  }

  @Get('me')
  async getUser(@Req() req: Request) {
    if (!req.session.user) {
      throw new UnauthorizedException('Not authenticated');
    }
    
    return {
      username: req.session.user.username,
      role: req.session.user.role
    };
  }
} 