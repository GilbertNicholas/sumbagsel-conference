import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemovePasswordHashFromUsers1790000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'password_hash');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password_hash',
        type: 'text',
        isNullable: true,
      }),
    );
  }
}
