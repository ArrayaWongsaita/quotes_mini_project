import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

// ประกาศ global variable สำหรับ development mode
const globalForPrisma = global as { prisma?: PrismaClient };

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();

    // เพิ่ม logging เพื่อดูว่าเป็น instance ใหม่หรือเก่า
    if (process.env.NODE_ENV === 'development')
      console.log(
        'PrismaService: Using global instance to prevent multiple connections during hot reload',
      );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// ทำ singleton pattern สำหรับ development mode
// ถ้าไม่อยู่ใน production ให้ใช้ instance เดิมแทนการสร้างใหม่
export const prismaClient =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : globalForPrisma.prisma || (globalForPrisma.prisma = new PrismaClient());
