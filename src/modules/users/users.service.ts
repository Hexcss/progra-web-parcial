// src/modules/users/users.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { hashString, verifyHash } from '../../common/crypto/argon2.util';
import { UpdateUserDto } from './dto/update-user.dto';

type ListParams = { q?: string; role?: Role; limit?: number; page?: number };

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

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { new: true })
      .select('_id email displayName role createdAt avatarUrl')
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async adminUpdateUser(id: string, dto: UpdateUserDto & { role?: Role }) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.role) update.role = dto.role;
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .select('_id email displayName role createdAt avatarUrl')
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    const res = await this.userModel.deleteOne({ _id: id }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('User not found');
    return { success: true };
  }

  async list(params: ListParams) {
    const limit = Math.max(1, Math.min(200, Number(params.limit ?? 20)));
    const page = Math.max(1, Number(params.page ?? 1));
    const filter: any = {};
    if (params.q) {
      filter.$or = [
        { email: { $regex: params.q, $options: 'i' } },
        { displayName: { $regex: params.q, $options: 'i' } },
      ];
    }
    if (params.role) filter.role = params.role;

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('_id email displayName role createdAt avatarUrl')
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async setRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      await this.userModel.updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } }).exec();
      return;
    }
    const hash = await hashString(refreshToken);
    await this.userModel.updateOne({ _id: userId }, { $set: { refreshTokenHash: hash } }).exec();
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user?.refreshTokenHash) return false;
    return verifyHash(user.refreshTokenHash, refreshToken);
  }
}
