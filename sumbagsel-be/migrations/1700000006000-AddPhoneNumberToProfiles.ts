import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneNumberToProfiles1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({
        name: 'phone_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'phone_number');
  }
}
