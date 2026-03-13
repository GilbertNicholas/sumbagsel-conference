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
  { code: 'adminGBT', name: 'Gilbert', role: 'master' as const },
  { code: 'adminIRS', name: 'Iros', role: 'master' as const },
  { code: 'adminMLH', name: 'Milihana', role: 'biasa' as const },
  { code: 'adminCRT', name: 'Cresta', role: 'biasa' as const },
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
        where: { code: seed.code },
      });
      if (admin) {
        admin.name = seed.name;
        admin.role = seed.role;
        admin.isActive = true;
        await adminRepository.save(admin);
        console.log(`✅ Admin updated: ${seed.name} (${seed.code}) - ${seed.role}`);
      } else {
        admin = adminRepository.create({
          ...seed,
          isActive: true,
        });
        await adminRepository.save(admin);
        console.log(`✅ Admin created: ${seed.name} (${seed.code}) - ${seed.role}`);
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
