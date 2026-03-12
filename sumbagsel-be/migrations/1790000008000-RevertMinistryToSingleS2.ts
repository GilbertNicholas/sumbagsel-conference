import { MigrationInterface, QueryRunner } from 'typeorm';

export class RevertMinistryToSingleS21790000008000 implements MigrationInterface {
  name = 'RevertMinistryToSingleS21790000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE profiles SET ministry = 'Single/S2' WHERE ministry = 'Single/S2/Mentor'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE profiles SET ministry = 'Single/S2/Mentor' WHERE ministry = 'Single/S2'`,
    );
  }
}
