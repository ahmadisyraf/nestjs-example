import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtSetrvice: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.userService.signIn(email, password);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = { sub: user.id, username: user.email };

    return {
      accessToken: await this.jwtSetrvice.signAsync(payload),
    };
  }
}
