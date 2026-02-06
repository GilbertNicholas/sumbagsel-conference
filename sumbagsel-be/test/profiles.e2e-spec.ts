import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Profile } from '../src/entities/profile.entity';
import { UserIdentity, Provider } from '../src/entities/user-identity.entity';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../src/entities/user.entity';

describe('ProfilesController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create test user and get auth token
    const userRepo = dataSource.getRepository(User);
    const identityRepo = dataSource.getRepository(UserIdentity);

    const testUser = userRepo.create({
      email: 'profiletest@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
    });
    const savedUser = await userRepo.save(testUser);
    userId = savedUser.id;

    const identity = identityRepo.create({
      userId: savedUser.id,
      provider: Provider.LOCAL,
      providerUserId: savedUser.email,
    });
    await identityRepo.save(identity);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'profiletest@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    const profileRepo = dataSource.getRepository(Profile);
    const identityRepo = dataSource.getRepository(UserIdentity);
    const userRepo = dataSource.getRepository(User);

    await profileRepo.delete({ userId });
    await identityRepo.delete({ userId });
    await userRepo.delete({ id: userId });

    await app.close();
  });

  describe('GET /api/profiles/me', () => {
    it('should return 404 if profile does not exist', () => {
      return request(app.getHttpServer())
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return profile if exists', async () => {
      // Create profile first
      const profileRepo = dataSource.getRepository(Profile);
      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });

      const profile = profileRepo.create({
        userId,
        fullName: 'Test User',
        churchName: 'Test Church',
        contactEmail: user?.email || 'test@example.com',
        isCompleted: true,
      });
      await profileRepo.save(profile);

      const response = await request(app.getHttpServer())
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('fullName', 'Test User');
      expect(response.body).toHaveProperty('churchName', 'Test Church');
      expect(response.body).toHaveProperty('isCompleted', true);

      // Cleanup
      await profileRepo.delete({ userId });
    });
  });

  describe('POST /api/profiles', () => {
    it('should create profile successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'New User',
          churchName: 'New Church',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('fullName', 'New User');
      expect(response.body).toHaveProperty('churchName', 'New Church');
      expect(response.body).toHaveProperty('isCompleted', true);
      expect(response.body.contactEmail).toBe('profiletest@example.com');

      // Cleanup
      const profileRepo = dataSource.getRepository(Profile);
      await profileRepo.delete({ userId });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/profiles')
        .send({
          fullName: 'Test',
          churchName: 'Test',
        })
        .expect(401);
    });

    it('should set isCompleted to true when fullName and churchName are provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Complete User',
          churchName: 'Complete Church',
        })
        .expect(201);

      expect(response.body.isCompleted).toBe(true);

      // Cleanup
      const profileRepo = dataSource.getRepository(Profile);
      await profileRepo.delete({ userId });
    });
  });

  describe('PATCH /api/profiles/me', () => {
    beforeEach(async () => {
      // Create profile for update tests
      const profileRepo = dataSource.getRepository(Profile);
      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });

      const profile = profileRepo.create({
        userId,
        fullName: 'Original Name',
        churchName: 'Original Church',
        contactEmail: user?.email || 'test@example.com',
        isCompleted: false,
      });
      await profileRepo.save(profile);
    });

    afterEach(async () => {
      // Cleanup
      const profileRepo = dataSource.getRepository(Profile);
      await profileRepo.delete({ userId });
    });

    it('should update profile successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Updated Name',
          churchName: 'Updated Church',
        })
        .expect(200);

      expect(response.body.fullName).toBe('Updated Name');
      expect(response.body.churchName).toBe('Updated Church');
      expect(response.body.isCompleted).toBe(true);
    });

    it('should return 404 if profile does not exist', async () => {
      // Delete profile first
      const profileRepo = dataSource.getRepository(Profile);
      await profileRepo.delete({ userId });

      return request(app.getHttpServer())
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Test',
        })
        .expect(404);
    });
  });
});

