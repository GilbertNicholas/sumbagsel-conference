import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Admin login hanya dengan adminID (code). Drop table admins dan recreate tanpa phone_number/email.
 * Seed: Gilbert (adminGBT/master), Iros (adminIRS/master), Milihana (adminMLH/biasa), Cresta (adminCRT/biasa).
 */
export class AdminLoginByCodeOnly1790000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('admins', true);

    await queryRunner.createTable(
      new Table({
        name: 'admins',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '20',
            default: "'biasa'",
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'admins',
      new TableIndex({
        name: 'IDX_admins_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

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
    await queryRunner.dropTable('admins', true);

    await queryRunner.createTable(
      new Table({
        name: 'admins',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '20',
            default: "'biasa'",
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'admins',
      new TableIndex({
        name: 'IDX_admins_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    await queryRunner.query(`
      INSERT INTO admins (id, code, phone_number, email, name, role, is_active, created_at, updated_at)
      VALUES
        (UUID(), 'ADMIN_MASTER_001', '087780271525', 'gilbertnicholas09@gmail.com', 'Admin Master', 'master', true, NOW(), NOW()),
        (UUID(), 'ADMIN_BIASA_001', '087780271526', 'gilbertnicholas34@gmail.com', 'Admin Biasa', 'biasa', true, NOW(), NOW())
    `);
  }
}
