import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export interface User {
  username: string;
  password: string; // hashed
  role: 'read' | 'write';
}

export interface AuthenticatedUser {
  username: string;
  role: 'read' | 'write';
}

@Injectable()
export class AuthService {
  private readonly users: User[] = [
    {
      username: 'tailor',
      password: bcrypt.hashSync('speaks', 10),
      role: 'read'
    },
    {
      username: 'tj',
      password: bcrypt.hashSync('litchi123', 10),
      role: 'write'
    },
    {
      username: 'emma',
      password: bcrypt.hashSync('luke123', 10),
      role: 'write'
    },
    {
      username: 'sura',
      password: bcrypt.hashSync('oliver123', 10),
      role: 'write'
    },
    {
      username: 'jaegar',
      password: bcrypt.hashSync('meister123', 10),
      role: 'write'
    },
    {
      username: 'richard',
      password: bcrypt.hashSync('oreo123', 10),
      role: 'write'
    },
  ];

  async validateUser(username: string, password: string): Promise<AuthenticatedUser | null> {
    const user = this.users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
      return {
        username: user.username,
        role: user.role
      };
    }
    return null;
  }

  getUserByUsername(username: string): AuthenticatedUser | null {
    const user = this.users.find(u => u.username === username);
    if (user) {
      return {
        username: user.username,
        role: user.role
      };
    }
    return null;
  }
} 