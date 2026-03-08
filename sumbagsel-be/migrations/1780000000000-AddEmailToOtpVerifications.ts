import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddEmailToOtpVerifications1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'otp_verifications',
      'phone_number',
      new TableColumn({
        name: 'phone_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'otp_verifications',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.createIndex(
      'otp_verifications',
      new TableIndex({
        name: 'IDX_otp_verifications_email',
        columnNames: ['email'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('otp_verifications', 'IDX_otp_verifications_email');
    await queryRunner.dropColumn('otp_verifications', 'email');
    await queryRunner.changeColumn(
      'otp_verifications',
      'phone_number',
      new TableColumn({
        name: 'phone_number',
        type: 'varchar',
        length: '20',
        isNullable: false,
      }),
    );
  }
}
