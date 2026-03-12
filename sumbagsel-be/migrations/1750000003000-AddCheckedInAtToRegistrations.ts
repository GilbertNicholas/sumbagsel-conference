import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCheckedInAtToRegistrations1750000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'checked_in_at',
        type: 'datetime',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registrations', 'checked_in_at');
  }
}
