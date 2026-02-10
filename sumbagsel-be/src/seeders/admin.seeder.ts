import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Admin } from '../entities/admin.entity';

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
    entities: [Admin],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const adminRepository = dataSource.getRepository(Admin);

    // Check if admin already exists
    const existingAdmin = await adminRepository.findOne({
      where: { code: 'ADMIN123' },
    });

    if (existingAdmin) {
      console.log('✅ Admin dengan kode ADMIN123 sudah ada');
      console.log(`   Code: ${existingAdmin.code}`);
      console.log(`   Name: ${existingAdmin.name || 'N/A'}`);
      console.log(`   Active: ${existingAdmin.isActive}`);
      await dataSource.destroy();
      return;
    }

    // Create default admin
    const admin = adminRepository.create({
      code: 'ADMIN123',
      name: 'Admin Default',
      isActive: true,
    });

    await adminRepository.save(admin);

    console.log('✅ Admin seeded successfully!');
    console.log(`   Code: ${admin.code}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Active: ${admin.isActive}`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();
