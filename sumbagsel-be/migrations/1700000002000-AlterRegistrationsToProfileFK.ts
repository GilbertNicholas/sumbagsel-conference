import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AlterRegistrationsToProfileFK1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing foreign key and index
    const table = await queryRunner.getTable('registrations');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('registrations', foreignKey);
    }
    
    const index = table?.indices.find(idx => idx.name === 'IDX_registrations_user_id');
    if (index) {
      await queryRunner.dropIndex('registrations', index);
    }

    // Drop columns that are no longer needed
    await queryRunner.dropColumn('registrations', 'full_name');
    await queryRunner.dropColumn('registrations', 'church_name');
    await queryRunner.dropColumn('registrations', 'phone_number');
    await queryRunner.dropColumn('registrations', 'special_notes');

    // Rename user_id to profile_id
    await queryRunner.renameColumn('registrations', 'user_id', 'profile_id');

    // Add unique constraint to profile_id
    await queryRunner.createIndex(
      'registrations',
      new TableIndex({
        name: 'IDX_registrations_profile_id',
        columnNames: ['profile_id'],
        isUnique: true,
      }),
    );

    // Create new foreign key to profiles table
    await queryRunner.createForeignKey(
      'registrations',
      new TableForeignKey({
        columnNames: ['profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'profiles',
        onDelete: 'CASCADE',
      }),
    );

    // Status column already exists with correct default, no need to change
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new foreign key and index
    const table = await queryRunner.getTable('registrations');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('profile_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('registrations', foreignKey);
    }
    
    const index = table?.indices.find(idx => idx.name === 'IDX_registrations_profile_id');
    if (index) {
      await queryRunner.dropIndex('registrations', index);
    }

    // Rename profile_id back to user_id
    await queryRunner.renameColumn('registrations', 'profile_id', 'user_id');

    // Add back columns
    await queryRunner.addColumn('registrations', new TableColumn({
      name: 'full_name',
      type: 'varchar',
      length: '150',
      isNullable: false,
    }));

    await queryRunner.addColumn('registrations', new TableColumn({
      name: 'church_name',
      type: 'varchar',
      length: '150',
      isNullable: false,
    }));

    await queryRunner.addColumn('registrations', new TableColumn({
      name: 'phone_number',
      type: 'varchar',
      length: '20',
      isNullable: true,
    }));

    await queryRunner.addColumn('registrations', new TableColumn({
      name: 'special_notes',
      type: 'text',
      isNullable: true,
    }));

    // Recreate foreign key to users table
    await queryRunner.createForeignKey(
      'registrations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Recreate index
    await queryRunner.createIndex(
      'registrations',
      new TableIndex({
        name: 'IDX_registrations_user_id',
        columnNames: ['user_id'],
      }),
    );
  }
}
