import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Drop admins table and recreate with role column.
 * Role: 'master' = can approve/reject registrations; 'biasa' = cannot.
 * Seeds: ADMIN123 (master), 087780271525 (biasa).
 */
export class AddRoleToAdminsAndRecreate1790000002000 implements MigrationInterface {
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
            name: 'phone_number',
            type: 'varchar',
            length: '20',
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

    // Seed: Admin Master (ADMIN123) - untuk menyetujui/menolak
    await queryRunner.query(`
      INSERT INTO admins (id, code, phone_number, name, role, is_active, created_at, updated_at)
      VALUES (UUID(), 'ADMIN123', '081234567890', 'Admin Master', 'master', true, NOW(), NOW())
    `);

    // Seed: Admin Biasa (087780271525) - tidak bisa menyetujui/menolak
    await queryRunner.query(`
      INSERT INTO admins (id, code, phone_number, name, role, is_active, created_at, updated_at)
      VALUES (UUID(), 'ADMIN_BIASA_001', '087780271525', 'Admin Biasa', 'biasa', true, NOW(), NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('admins', 'IDX_admins_code');
    await queryRunner.dropTable('admins', true);

    // Recreate original structure (without role)
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
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: true,
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
  }
}
