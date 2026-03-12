import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOtpVerificationsTable1740000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'otp_verifications',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'otp',
            type: 'varchar',
            length: '6',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'datetime',
            isNullable: false,
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'otp_verifications',
      new TableIndex({
        name: 'IDX_otp_verifications_phone_number',
        columnNames: ['phone_number'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('otp_verifications', true);
  }
}
