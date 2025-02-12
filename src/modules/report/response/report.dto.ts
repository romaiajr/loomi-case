import { ApiProperty } from '@nestjs/swagger';

export class ReportDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Relatório de Vendas - Janeiro 2025' })
  name!: string;

  @ApiProperty({
    example: '/reports/sales_report_2025-01-01_to_2025-01-31.csv',
  })
  file_path!: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  start_date!: Date;

  @ApiProperty({ example: '2025-01-31T23:59:59.999Z' })
  end_date!: Date;

  @ApiProperty({ example: 5000.75, description: 'Total faturado no período' })
  amount!: number;

  @ApiProperty({
    example: 150,
    description: 'Total de itens vendidos no período',
  })
  sold_items!: number;
}
