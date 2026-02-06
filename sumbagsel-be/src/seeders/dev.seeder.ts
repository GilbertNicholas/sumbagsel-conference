import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User, UserStatus } from '../entities/user.entity';
import { UserIdentity, Provider } from '../entities/user-identity.entity';
import { Profile } from '../entities/profile.entity';
import * as bcrypt from 'bcrypt';

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: `.env.${nodeEnv}.local` });
config({ path: `.env.${nodeEnv}` });
config({ path: '.env.local' });
config({ path: '.env' });

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, UserIdentity, Profile],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const userRepository = dataSource.getRepository(User);
    const identityRepository = dataSource.getRepository(UserIdentity);
    const profileRepository = dataSource.getRepository(Profile);

    // Clear existing data (optional, for dev only)
    await profileRepository.delete({});
    await identityRepository.delete({});
    await userRepository.delete({});

    // Create test user with local identity
    const testUser = userRepository.create({
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
    });
    const savedUser = await userRepository.save(testUser);

    // Create local identity
    const localIdentity = identityRepository.create({
      userId: savedUser.id,
      provider: Provider.LOCAL,
      providerUserId: savedUser.email,
    });
    await identityRepository.save(localIdentity);

    // Create profile
    const profile = profileRepository.create({
      userId: savedUser.id,
      fullName: 'Test User',
      churchName: 'Test Church',
      contactEmail: 'test@example.com',
      isCompleted: true,
      completedAt: new Date(),
    });
    await profileRepository.save(profile);

    console.log('✅ Seeding completed successfully!');
    console.log(`   Created user: ${savedUser.email}`);
    console.log(`   Password: password123`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();

