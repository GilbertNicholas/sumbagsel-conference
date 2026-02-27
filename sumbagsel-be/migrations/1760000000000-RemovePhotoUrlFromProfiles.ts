import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemovePhotoUrlFromProfiles1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'photo_url');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({
        name: 'photo_url',
        type: 'text',
        isNullable: true,
      }),
    );
  }
}
