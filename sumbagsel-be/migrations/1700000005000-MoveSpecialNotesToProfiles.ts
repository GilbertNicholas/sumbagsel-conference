import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MoveSpecialNotesToProfiles1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add special_notes column to profiles table
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({
        name: 'special_notes',
        type: 'text',
        isNullable: true,
      }),
    );

    // Migrate data from registrations to profiles
    await queryRunner.query(`
      UPDATE profiles p
      INNER JOIN registrations r ON p.user_id = r.user_id
      SET p.special_notes = r.special_notes
      WHERE r.special_notes IS NOT NULL
    `);

    // Drop special_notes column from registrations table
    await queryRunner.dropColumn('registrations', 'special_notes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add special_notes column back to registrations table
    await queryRunner.addColumn(
      'registrations',
      new TableColumn({
        name: 'special_notes',
        type: 'text',
        isNullable: true,
      }),
    );

    // Migrate data back from profiles to registrations
    await queryRunner.query(`
      UPDATE registrations r
      INNER JOIN profiles p ON r.user_id = p.user_id
      SET r.special_notes = p.special_notes
      WHERE p.special_notes IS NOT NULL
    `);

    // Drop special_notes column from profiles table
    await queryRunner.dropColumn('profiles', 'special_notes');
  }
}
