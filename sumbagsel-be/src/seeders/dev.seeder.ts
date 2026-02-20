import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User, UserStatus } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: `.env.${nodeEnv}.local` });
config({ path: `.env.${nodeEnv}` });
config({ path: '.env.local' });
config({ path: '.env' });

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    url: process.env.DATABASE_URL,
    entities: [User, Profile],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const userRepository = dataSource.getRepository(User);
    const profileRepository = dataSource.getRepository(Profile);

    // Clear existing data (optional, for dev only)
    await profileRepository.delete({});
    await userRepository.delete({});

    // Create test user with phone number
    const testUser = userRepository.create({
      email: 'test@example.com', // Optional email for test user
      passwordHash: null, // No password needed for WA login
      isEmailVerified: false,
      status: UserStatus.ACTIVE,
    });
    const savedUser = await userRepository.save(testUser);

    // Create profile with phone number
    const profile = profileRepository.create({
      userId: savedUser.id,
      fullName: 'Test User',
      churchName: 'Test Church',
      contactEmail: 'test@example.com',
      phoneNumber: '081234567890', // Test phone number
      isCompleted: true,
      completedAt: new Date(),
    });
    await profileRepository.save(profile);

    console.log('✅ Seeding completed successfully!');
    console.log(`   Created user with phone: ${profile.phoneNumber}`);
    console.log(`   Email: ${savedUser.email || 'N/A'}`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();

