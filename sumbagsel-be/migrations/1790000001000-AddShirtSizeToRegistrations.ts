import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShirtSizeToRegistrations1790000001000 implements MigrationInterface {
  name = 'AddShirtSizeToRegistrations1790000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE registrations ADD COLUMN shirt_size VARCHAR(10) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE registrations DROP COLUMN shirt_size`);
  }
}
