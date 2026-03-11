import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCheckedInAtToRegistrationChildren1790000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'registration_children',
      new TableColumn({
        name: 'checked_in_at',
        type: 'datetime',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registration_children', 'checked_in_at');
  }
}
