import { DataSource } from 'typeorm';
import { Admin } from '../entities/admin.entity';

const ADMIN_SEEDS = [
  { code: 'adminGBT', name: 'Gilbert', role: 'master' as const },
  { code: 'adminIRS', name: 'Iros', role: 'master' as const },
  { code: 'adminMLH', name: 'Milihana', role: 'biasa' as const },
  { code: 'adminCRT', name: 'Cresta', role: 'biasa' as const },
];

export async function seedAdmins(dataSource: DataSource): Promise<void> {
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
}
