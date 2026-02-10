import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneNumberToUser1739090000000 implements MigrationInterface {
    name = 'AddPhoneNumberToUser1739090000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "phone_number" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_1739090000000" UNIQUE ("phone_number")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_1739090000000"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_number"`);
    }
}
