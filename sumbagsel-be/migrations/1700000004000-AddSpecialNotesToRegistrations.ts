import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSpecialNotesToRegistrations1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'special_notes',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registrations', 'special_notes');
  }
}
