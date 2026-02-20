import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRegistrationsAndArrivalSchedules1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create registrations table
    await queryRunner.createTable(
      new Table({
        name: 'registrations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'church_name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'special_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payment_proof_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'Belum terdaftar'",
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key for registrations
    await queryRunner.createForeignKey(
      'registrations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create index for registrations user_id
    await queryRunner.createIndex(
      'registrations',
      new TableIndex({
        name: 'IDX_registrations_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create arrival_schedules table
    await queryRunner.createTable(
      new Table({
        name: 'arrival_schedules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: '(UUID())',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'transportation_type',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'carrier_name',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'flight_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'arrival_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'arrival_time',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key for arrival_schedules
    await queryRunner.createForeignKey(
      'arrival_schedules',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create index for arrival_schedules user_id
    await queryRunner.createIndex(
      'arrival_schedules',
      new TableIndex({
        name: 'IDX_arrival_schedules_user_id',
        columnNames: ['user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop arrival_schedules table
    await queryRunner.dropTable('arrival_schedules', true);

    // Drop registrations table
    await queryRunner.dropTable('registrations', true);
  }
}
