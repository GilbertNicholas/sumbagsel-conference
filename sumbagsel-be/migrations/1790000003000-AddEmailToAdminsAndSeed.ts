import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add email column to admins. Admin login can use phone OR email (only registered ones).
 * Seeds: gilbertnicholas09@gmail.com 087780271525 (master), gilbertnicholas34@gmail.com 087780271526 (biasa).
 */
export class AddEmailToAdminsAndSeed1790000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'admins',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Replace with new admin seeds
    await queryRunner.query(`DELETE FROM admins`);
    await queryRunner.query(`
      INSERT INTO admins (id, code, phone_number, email, name, role, is_active, created_at, updated_at)
      VALUES
        (UUID(), 'ADMIN_MASTER_001', '087780271525', 'gilbertnicholas09@gmail.com', 'Admin Master', 'master', true, NOW(), NOW()),
        (UUID(), 'ADMIN_BIASA_001', '087780271526', 'gilbertnicholas34@gmail.com', 'Admin Biasa', 'biasa', true, NOW(), NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM admins`);
    await queryRunner.query(`
      INSERT INTO admins (id, code, phone_number, email, name, role, is_active, created_at, updated_at)
      VALUES
        (UUID(), 'ADMIN123', '081234567890', NULL, 'Admin Master', 'master', true, NOW(), NOW()),
        (UUID(), 'ADMIN_BIASA_001', '087780271525', NULL, 'Admin Biasa', 'biasa', true, NOW(), NOW())
    `);
    await queryRunner.dropColumn('admins', 'email');
  }
}
