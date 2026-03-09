import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenderToProfiles1790000000000 implements MigrationInterface {
  name = 'AddGenderToProfiles1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE profiles ADD COLUMN gender VARCHAR(20) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE profiles DROP COLUMN gender`);
  }
}
