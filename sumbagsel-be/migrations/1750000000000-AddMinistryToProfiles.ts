import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMinistryToProfiles1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({
        name: 'ministry',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'ministry');
  }
}
