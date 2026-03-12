import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Admin } from '../entities/admin.entity';

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: `.env.${nodeEnv}.local` });
config({ path: `.env.${nodeEnv}` });
config({ path: '.env.local' });
config({ path: '.env' });

const ADMIN_SEEDS = [
  {
    code: 'ADMIN_MASTER_001',
    phoneNumber: '087780271525',
    email: 'gilbertnicholas09@gmail.com',
    name: 'Admin Master',
    role: 'master' as const,
  },
  {
    code: 'ADMIN_BIASA_001',
    phoneNumber: '087780271526',
    email: 'gilbertnicholas34@gmail.com',
    name: 'Admin Biasa',
    role: 'biasa' as const,
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    url: process.env.DATABASE_URL,
    entities: [Admin],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const adminRepository = dataSource.getRepository(Admin);

    for (const seed of ADMIN_SEEDS) {
      let admin = await adminRepository.findOne({
        where: [{ phoneNumber: seed.phoneNumber }, { email: seed.email }],
      });
      if (admin) {
        admin.code = seed.code;
        admin.phoneNumber = seed.phoneNumber;
        admin.email = seed.email;
        admin.name = seed.name;
        admin.role = seed.role;
        admin.isActive = true;
        await adminRepository.save(admin);
        console.log(`✅ Admin updated: ${seed.email} (${seed.role})`);
      } else {
        admin = adminRepository.create({
          ...seed,
          isActive: true,
        });
        await adminRepository.save(admin);
        console.log(`✅ Admin created: ${seed.email} (${seed.role})`);
      }
    }

    console.log('✅ Admin seed selesai');
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();
