import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { Role } from 'src/common/enums/role.enum';
import { hashString, verifyHash } from 'src/common/crypto/argon2.util';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async createUser(dto: CreateUserDto, role: Role = Role.USER): Promise<UserDocument> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await hashString(dto.password);
    const created = new this.userModel({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role,
    });
    return created.save();
  }

  async setRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      await this.userModel.updateOne(
        { _id: userId },
        { $unset: { refreshTokenHash: 1 } }
      ).exec();
      return;
    }
    const hash = await hashString(refreshToken);
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshTokenHash: hash } }
    ).exec();
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user?.refreshTokenHash) return false;
    return verifyHash(user.refreshTokenHash, refreshToken);
  }
}
