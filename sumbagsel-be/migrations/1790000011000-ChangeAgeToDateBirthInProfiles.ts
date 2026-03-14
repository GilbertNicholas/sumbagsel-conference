import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ubah kolom age menjadi date_birth (DATE) di profiles.
 * Migrasi data: date_birth = CURDATE() - INTERVAL age YEAR untuk row yang punya age.
 */
export class ChangeAgeToDateBirthInProfiles1790000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE profiles ADD COLUMN date_birth DATE NULL`,
    );
    await queryRunner.query(
      `UPDATE profiles SET date_birth = DATE_SUB(CURDATE(), INTERVAL age YEAR) WHERE age IS NOT NULL AND age >= 13 AND age <= 100`,
    );
    await queryRunner.query(`ALTER TABLE profiles DROP COLUMN age`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE profiles ADD COLUMN age SMALLINT NULL`,
    );
    await queryRunner.query(
      `UPDATE profiles SET age = TIMESTAMPDIFF(YEAR, date_birth, CURDATE()) WHERE date_birth IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE profiles DROP COLUMN date_birth`);
  }
}
