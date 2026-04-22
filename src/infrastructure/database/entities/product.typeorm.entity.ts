import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('PRODUCTS')
@Check('CHECK_POSITIVE_STOCK', 'QTY_DIS_PRO >= 0')
export class ProductTypeOrmEntity {
  @ApiProperty({ description: 'Product unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Product code' })
  @Column({ name: 'COD_PRO', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Product name' })
  @Column({ name: 'NAM_PRO', length: 255 })
  name: string;

  @ApiProperty({ description: 'Product description' })
  @Column({ name: 'DES_PRO', type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Product unit price' })
  @Column({ name: 'PRI_UNI_PRO', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ description: 'Available stock quantity' })
  @Column({ name: 'QTY_DIS_PRO', type: 'int' })
  availableQuantity: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt: Date;

  @ApiProperty({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ name: 'DEL_AT' })
  deletedAt?: Date;
}
