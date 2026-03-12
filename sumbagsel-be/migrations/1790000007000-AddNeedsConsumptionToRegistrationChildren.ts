import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNeedsConsumptionToRegistrationChildren1790000007000 implements MigrationInterface {
  name = 'AddNeedsConsumptionToRegistrationChildren1790000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE registration_children ADD COLUMN needs_consumption TINYINT(1) NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE registration_children DROP COLUMN needs_consumption`);
  }
}
