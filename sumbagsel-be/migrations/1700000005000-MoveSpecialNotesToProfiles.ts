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
      SET special_notes = r.special_notes
      FROM registrations r
      WHERE p.user_id = r.user_id
      AND r.special_notes IS NOT NULL
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
      SET special_notes = p.special_notes
      FROM profiles p
      WHERE r.user_id = p.user_id
      AND p.special_notes IS NOT NULL
    `);

    // Drop special_notes column from profiles table
    await queryRunner.dropColumn('profiles', 'special_notes');
  }
}
