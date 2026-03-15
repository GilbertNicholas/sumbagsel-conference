import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add shirt_sizes JSON column for multiple shirts.
 * First shirt included (Rp 0), extras Rp 75.000 each.
 * Migrate existing shirt_size to shirt_sizes.
 */
export class AddShirtSizesToRegistrations1790000012000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE registrations ADD COLUMN shirt_sizes JSON NULL`,
    );
    // Migrate shirt_size -> shirt_sizes
    await queryRunner.query(
      `UPDATE registrations SET shirt_sizes = JSON_ARRAY(shirt_size) WHERE shirt_size IS NOT NULL AND shirt_size != ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE registrations DROP COLUMN shirt_sizes`);
  }
}
