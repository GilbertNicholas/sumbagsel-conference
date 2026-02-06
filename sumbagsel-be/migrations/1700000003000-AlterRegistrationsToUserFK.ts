import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

export class AlterRegistrationsToUserFK1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing foreign key and index for profile_id
    const table = await queryRunner.getTable('registrations');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('profile_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('registrations', foreignKey);
    }
    
    const index = table?.indices.find(idx => idx.name === 'IDX_registrations_profile_id');
    if (index) {
      await queryRunner.dropIndex('registrations', index);
    }

    // Rename profile_id to user_id
    await queryRunner.renameColumn('registrations', 'profile_id', 'user_id');

    // Create index for user_id (UNIQUE, as one user can only have one registration)
    await queryRunner.createIndex(
      'registrations',
      new TableIndex({
        name: 'IDX_registrations_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    // Create new foreign key to users table
    await queryRunner.createForeignKey(
      'registrations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new foreign key and index
    const table = await queryRunner.getTable('registrations');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('registrations', foreignKey);
    }
    
    const index = table?.indices.find(idx => idx.name === 'IDX_registrations_user_id');
    if (index) {
      await queryRunner.dropIndex('registrations', index);
    }

    // Rename user_id back to profile_id
    await queryRunner.renameColumn('registrations', 'user_id', 'profile_id');

    // Recreate foreign key to profiles table
    await queryRunner.createForeignKey(
      'registrations',
      new TableForeignKey({
        columnNames: ['profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'profiles',
        onDelete: 'CASCADE',
      }),
    );

    // Recreate unique index
    await queryRunner.createIndex(
      'registrations',
      new TableIndex({
        name: 'IDX_registrations_profile_id',
        columnNames: ['profile_id'],
        isUnique: true,
      }),
    );
  }
}
