import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_email_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
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

    // Create user_identities table
    await queryRunner.createTable(
      new Table({
        name: 'user_identities',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'provider_user_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create profiles table
    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'church_name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'contact_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'photo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_completed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'datetime',
            isNullable: true,
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

    // Create foreign keys
    await queryRunner.createForeignKey(
      'user_identities',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'profiles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index for user_identities (provider, provider_user_id) - MySQL uses index, not constraint
    await queryRunner.createIndex(
      'user_identities',
      new TableIndex({
        name: 'UQ_user_identities_provider_provider_user_id',
        columnNames: ['provider', 'provider_user_id'],
        isUnique: true,
      }),
    );

    // Create index on user_identities.user_id
    await queryRunner.createIndex(
      'user_identities',
      new TableIndex({
        columnNames: ['user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const userIdentitiesTable = await queryRunner.getTable('user_identities');
    const userIdentitiesForeignKey = userIdentitiesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (userIdentitiesForeignKey) {
      await queryRunner.dropForeignKey('user_identities', userIdentitiesForeignKey);
    }

    const profilesTable = await queryRunner.getTable('profiles');
    const profilesForeignKey = profilesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (profilesForeignKey) {
      await queryRunner.dropForeignKey('profiles', profilesForeignKey);
    }

    // Drop tables
    await queryRunner.dropTable('profiles', true);
    await queryRunner.dropTable('user_identities', true);
    await queryRunner.dropTable('users', true);
  }
}

