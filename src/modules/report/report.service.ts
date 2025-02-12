import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Report } from '@entities/report';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'json2csv';
import { runInTransaction } from '@utils/run-in-transaction';
import { ReportDTO } from './response/report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    private dataSource: DataSource,
  ) {}

  private toDTO(report: Report): ReportDTO {
    const reportDto = new ReportDTO();
    reportDto.id = report.id;
    reportDto.file_path = report.file_path;
    reportDto.name = report.name;
    reportDto.amount = report.amount;
    reportDto.start_date = report.start_date;
    reportDto.end_date = report.end_date;
    reportDto.sold_items = report.sold_items;
    return reportDto;
  }

  async generateSalesReport(
    startDate: Date,
    endDate: Date,
  ): Promise<ReportDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const query = `
        SELECT 
          p.id AS product_id, 
          p.name AS product_name, 
          SUM(oi.quantity) AS total_sold,
          SUM(oi.amount) AS total_revenue
        FROM order_items oi
        INNER JOIN products p ON oi.product_id = p.id
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at BETWEEN $1 AND $2
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC;
      `;
      const salesData = await manager.query(query, [startDate, endDate]);
      if (salesData.length === 0) {
        throw new NotFoundException('Nenhuma venda encontrada no período.');
      }

      const totalAmount = salesData.reduce(
        (sum, row) => sum + parseFloat(row.total_revenue),
        0,
      );
      const totalItemsSold = salesData.reduce(
        (sum, row) => sum + parseInt(row.total_sold, 10),
        0,
      );

      const csvFilePath = this.createCSVFile(salesData, startDate, endDate);
      const report = manager.create(Report, {
        name: `Relatório ${startDate.toISOString()} - ${endDate.toISOString()}`,
        start_date: startDate,
        end_date: endDate,
        amount: totalAmount,
        sold_items: totalItemsSold,
        file_path: csvFilePath.split('loommerce\\')[1],
      });

      const savedReport = await manager.save(Report, report);

      return this.toDTO(savedReport);
    });
  }

  private createCSVFile(data: any[], startDate: Date, endDate: Date): string {
    const fields = [
      'product_id',
      'product_name',
      'total_sold',
      'total_revenue',
    ];
    const csvData = parse(data, { fields });

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const fileName = `sales_report_${startDateStr}_to_${endDateStr}.csv`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, csvData, { flag: 'w', encoding: 'utf-8' });
    return filePath;
  }

  async getReport(reportId: string): Promise<ReportDTO> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Relatório não encontrado.');
    }
    return this.toDTO(report);
  }

  async listReports(): Promise<ReportDTO[]> {
    const reports = await this.reportsRepository.find();
    return reports.map((report) => this.toDTO(report));
  }
}
