import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentMethodToSales1800000000008 implements MigrationInterface {
  name = 'AddPaymentMethodToSales1800000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'SALES',
      new TableColumn({
        name: 'PAY_MET_SAL',
        type: 'varchar',
        length: '20',
        isNullable: false,
        default: `'CASH'`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('SALES', 'PAY_MET_SAL');
  }
}
