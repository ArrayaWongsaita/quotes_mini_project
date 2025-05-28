/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { faker } from '@faker-js/faker/locale/th'; // ใช้ locale ภาษาไทย

describe('QOUTE API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let createdQuoteId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ต้องใช้ global pipes เหมือนในแอพจริงเพื่อให้ validation ทำงาน
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    // ตั้งค่าอื่นๆ ให้เหมือนกับใน main.ts

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // ล้างข้อมูลทดสอบที่อาจหลงเหลือ
    await prisma.vote.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // ล้างข้อมูลทดสอบ
    await prisma.vote.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  // ทดสอบการลงทะเบียนและเข้าสู่ระบบ
  describe('Authentication', () => {
    const testUser = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 10, memorable: true }),
      name: faker.person.fullName(),
    };

    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toEqual(testUser.email);
      expect(response.body.user.name).toEqual(testUser.name);

      // เก็บ token และ userId ไว้ใช้ในการทดสอบอื่นๆ
      authToken = response.body.accessToken;
      userId = response.body.user.id;

      // แสดง token เพื่อการดีบัก
      console.log(
        'Auth token from registration:',
        authToken.substring(0, 20) + '...',
      );
    });

    it('should not register a user with the same email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409); // Conflict
    });

    it('should login with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201); // ปรับจาก 200 เป็น 201 ตาม API จริง

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // อัปเดต token ให้เป็นอันที่ได้จาก login
      authToken = response.body.accessToken;
      console.log('Auth token from login:', authToken.substring(0, 20) + '...');
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.email).toEqual(testUser.email);
          expect(body.name).toEqual(testUser.name);
        });
    });
  });

  // ทดสอบส่วนของการจัดการคำคม
  describe('Quotes', () => {
    const testQuote = {
      content: faker.lorem.sentence(),
      author: faker.person.fullName(),
      tags: ['ทดสอบ', 'การค้นหา'], // กำหนดค่าแท็กที่แน่นอนเพื่อการทดสอบ
    };

    it('should create a new quote', async () => {
      // ตรวจสอบให้แน่ใจว่ามี token
      expect(authToken).toBeDefined();
      console.log('Using auth token:', authToken.substring(0, 20) + '...');

      const response = await request(app.getHttpServer())
        .post('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testQuote)
        .expect(201);

      expect(response.body.content).toEqual(testQuote.content);
      expect(response.body.author).toEqual(testQuote.author);
      expect(response.body.tags.length).toEqual(2);
      expect(response.body.userId).toEqual(userId);

      createdQuoteId = response.body.id;
    });

    it('should get quotes with pagination', () => {
      return request(app.getHttpServer())
        .get('/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(body.data.length).toBeGreaterThan(0);
          expect(body.totalItems).toBeGreaterThan(0);
          expect(body.page).toEqual(1);
        });
    });

    it('should get quotes filtered by tag', () => {
      // ใช้แท็กแรกจากคำคมทดสอบ
      const tagToFilter = testQuote.tags[0];

      return request(app.getHttpServer())
        .get(`/quotes?tag=${tagToFilter}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.length).toBeGreaterThan(0);
          expect(
            body.data[0].tags.some((tag) => tag.name === tagToFilter),
          ).toBeTruthy();
        });
    });

    it('should update an existing quote', () => {
      const updatedQuote = {
        content: faker.lorem.sentence({ min: 10, max: 20 }),
        tags: [
          ...testQuote.tags,
          faker.word.sample(), // เพิ่ม tag ใหม่
        ].filter((value, index, self) => self.indexOf(value) === index), // กำจัดค่าซ้ำ
      };

      return request(app.getHttpServer())
        .put(`/quotes/${createdQuoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedQuote)
        .expect(200)
        .expect(({ body }) => {
          expect(body.content).toEqual(updatedQuote.content);
          expect(body.tags.length).toEqual(3);
        });
    });
  });

  // ทดสอบส่วนของการโหวต
  describe('Votes', () => {
    it('should upvote a quote', () => {
      return request(app.getHttpServer())
        .put('/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: createdQuoteId,
          value: 1,
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body.success).toBeTruthy();
          expect(body.value).toEqual(1);
          expect(body.upVoteCount).toEqual(1);
        });
    });

    it('should change vote from upvote to downvote', () => {
      return request(app.getHttpServer())
        .put('/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: createdQuoteId,
          value: -1,
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body.success).toBeTruthy();
          expect(body.value).toEqual(-1);
          expect(body.upVoteCount).toEqual(0);
          expect(body.downVoteCount).toEqual(1);
        });
    });

    it('should remove a vote', () => {
      return request(app.getHttpServer())
        .put('/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: createdQuoteId,
          value: 0,
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body.success).toBeTruthy();
          expect(body.value).toBeNull();
          expect(body.upVoteCount).toEqual(0);
          expect(body.downVoteCount).toEqual(0);
        });
    });
  });

  // ทดสอบการลบคำคม (ให้ทดสอบท้ายสุด เพราะจะลบข้อมูลที่ใช้ทดสอบอื่นๆ)
  describe('Delete Quote', () => {
    it('should delete an existing quote', () => {
      return request(app.getHttpServer())
        .delete(`/quotes/${createdQuoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 when trying to delete non-existent quote', () => {
      return request(app.getHttpServer())
        .delete(`/quotes/${createdQuoteId}`) // ลองลบอีกครั้งหลังจากลบไปแล้ว
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
