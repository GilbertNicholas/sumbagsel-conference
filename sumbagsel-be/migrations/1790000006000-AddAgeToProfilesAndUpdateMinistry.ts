import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgeToProfilesAndUpdateMinistry1790000006000 implements MigrationInterface {
  name = 'AddAgeToProfilesAndUpdateMinistry1790000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE profiles ADD COLUMN age SMALLINT NULL`,
    );
    await queryRunner.query(
      `UPDATE profiles SET ministry = 'Single/S2/Mentor' WHERE ministry = 'Single/S2'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE profiles SET ministry = 'Single/S2' WHERE ministry = 'Single/S2/Mentor'`,
    );
    await queryRunner.query(`ALTER TABLE profiles DROP COLUMN age`);
  }
}
