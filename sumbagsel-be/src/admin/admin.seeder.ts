import { DataSource } from 'typeorm';
import { Admin } from '../entities/admin.entity';

export async function seedAdmins(dataSource: DataSource): Promise<void> {
  const adminRepository = dataSource.getRepository(Admin);

  // Check if admin already exists
  const existingAdmin = await adminRepository.findOne({
    where: { code: 'ADMIN123' },
  });

  if (existingAdmin) {
    if (!existingAdmin.phoneNumber) {
      existingAdmin.phoneNumber = '087780271525';
      await adminRepository.save(existingAdmin);
      console.log('Admin phone number updated to 087780271525');
    } else {
      console.log('Admin already exists, skipping seed');
    }
    return;
  }

  // Create default admin
  const admin = adminRepository.create({
    code: 'ADMIN123',
    name: 'Admin Default',
    phoneNumber: '087780271525',
    isActive: true,
  });

  await adminRepository.save(admin);
  console.log('Admin seeded successfully');
}
