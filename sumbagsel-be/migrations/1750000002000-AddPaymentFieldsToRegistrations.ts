import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentFieldsToRegistrations1750000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'unique_code',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'total_amount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'base_amount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registrations', 'unique_code');
    await queryRunner.dropColumn('registrations', 'total_amount');
    await queryRunner.dropColumn('registrations', 'base_amount');
  }
}
