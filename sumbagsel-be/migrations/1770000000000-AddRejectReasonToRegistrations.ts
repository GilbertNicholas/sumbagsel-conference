import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRejectReasonToRegistrations1770000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'reject_reason',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registrations', 'reject_reason');
  }
}
