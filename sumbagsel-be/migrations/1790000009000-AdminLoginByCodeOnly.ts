import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Admin login hanya dengan adminID (code). Hapus phone_number dan email.
 * Seed: Gilbert (adminGBT/master), Iros (adminIRS/master), Milihana (adminMLH/biasa), Cresta (adminCRT/biasa).
 */
export class AdminLoginByCodeOnly1790000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // MySQL: drop unique constraints/indexes before dropping columns
    const table = await queryRunner.getTable('admins');
    const dropIndexForCol = async (col: string) => {
      const idx = table?.indices?.find((i) => i.columnNames?.includes(col));
      const unq = table?.uniques?.find((u) => u.columnNames?.includes(col));
      const name = idx?.name || unq?.name;
      if (name) await queryRunner.query(`ALTER TABLE admins DROP INDEX \`${name}\``);
    };
    await dropIndexForCol('phone_number');
    await dropIndexForCol('email');
    await queryRunner.dropColumn('admins', 'phone_number');
    await queryRunner.dropColumn('admins', 'email');

    // Replace with new admin seeds
    await queryRunner.query(`DELETE FROM admins`);
    await queryRunner.query(`
      INSERT INTO admins (id, code, name, role, is_active, created_at, updated_at)
      VALUES
        (UUID(), 'adminGBT', 'Gilbert', 'master', true, NOW(), NOW()),
        (UUID(), 'adminIRS', 'Iros', 'master', true, NOW(), NOW()),
        (UUID(), 'adminMLH', 'Milihana', 'biasa', true, NOW(), NOW()),
        (UUID(), 'adminCRT', 'Cresta', 'biasa', true, NOW(), NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'admins',
      new TableColumn({
        name: 'phone_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
        isUnique: true,
      }),
    );
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

    await queryRunner.query(`DELETE FROM admins`);
    await queryRunner.query(`
      INSERT INTO admins (id, code, phone_number, email, name, role, is_active, created_at, updated_at)
      VALUES
        (UUID(), 'ADMIN_MASTER_001', '087780271525', 'gilbertnicholas09@gmail.com', 'Admin Master', 'master', true, NOW(), NOW()),
        (UUID(), 'ADMIN_BIASA_001', '087780271526', 'gilbertnicholas34@gmail.com', 'Admin Biasa', 'biasa', true, NOW(), NOW())
    `);
  }
}
