import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './users.entity';
import { Repository } from 'typeorm';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user-dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<FindUserDto> {
    const user = new Users();
    const hashPassword = await bcrypt.hash(createUserDto.password, 10);

    user.name = createUserDto.name;
    user.email = createUserDto.email;
    user.password = hashPassword.toString();

    const saved = await this.usersRepository.save(user).catch(() => {
      throw new InternalServerErrorException();
    });

    return this.entityToDto(saved);
  }

  async findAll(): Promise<FindUserDto[]> {
    const users = await this.usersRepository.find().catch(() => {
      throw new InternalServerErrorException();
    });

    return users.map((user) => this.entityToDto(user));
  }

  async find(userId: number): Promise<FindUserDto> {
    const cacheUser = await this.cacheManager.get<Users>(userId.toString());

    let user: Users;

    if (!cacheUser) {
      console.log('Caching user');
      user = await this.usersRepository.findOne({
        where: {
          id: userId,
        },
      });

      await this.cacheManager.set(user.id.toString(), user);

      return this.entityToDto(user);
    } else {
      console.log('Returned cache');
      return this.entityToDto(cacheUser);
    }
  }

  async update(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<FindUserDto> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    user.email = updateUserDto.email;
    user.name = updateUserDto.name;
    user.password = updateUserDto.password;

    const updated = await this.usersRepository.save(user).catch(() => {
      throw new InternalServerErrorException();
    });

    return this.entityToDto(updated);
  }

  async delete(userId: number) {
    await this.usersRepository.delete(userId);

    const cacheUser = await this.cacheManager.get<FindUserDto>(
      userId.toString(),
    );

    if (cacheUser) {
      await this.cacheManager.del(userId.toString());
    }

    return 'User deleted';
  }

  async signIn(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: {
        email,
      },
    });

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return user;
    } else {
      throw new UnauthorizedException();
    }
  }

  entityToDto(users: Users) {
    const findUserDto = new FindUserDto();

    findUserDto.id = users.id;
    findUserDto.name = users.name;
    findUserDto.email = users.email;

    return findUserDto;
  }
}
