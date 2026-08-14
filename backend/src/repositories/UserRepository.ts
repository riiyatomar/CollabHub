import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class UserRepository {
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByResetToken(resetToken: string) {
    return prisma.user.findFirst({
      where: { resetToken },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

export const userRepository = new UserRepository();
