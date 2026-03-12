import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneNumberToAdmins1750000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'admins',
      new TableColumn({
        name: 'phone_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('admins', 'phone_number');
  }
}
