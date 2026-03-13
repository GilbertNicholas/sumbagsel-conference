import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add registration_id column - unique ID generated when admin approves (e.g. BT076, EX025).
 * Format: church prefix (BT/LM/BK/PL/JB/EX) + 3 digit number.
 */
export class AddRegistrationIdToRegistrations1790000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'registration_id',
        type: 'varchar',
        length: '10',
        isNullable: true,
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registrations', 'registration_id');
  }
}
