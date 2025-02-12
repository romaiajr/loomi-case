import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { Report } from '@entities/report';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('ReportService', () => {
  let service: ReportService;
  let reportsRepository: Repository<Report>;
  let dataSource: DataSource;
  let mockQueryRunner;

  const mockReportsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        query: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportsRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    reportsRepository = module.get(getRepositoryToken(Report));
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('generateSalesReport', () => {
    it('Deve gerar um relatório de vendas com sucesso', async () => {
      const mockStartDate = new Date('2025-01-01');
      const mockEndDate = new Date('2025-01-31');
      const mockSalesData = [
        {
          product_id: '1',
          product_name: 'Produto A',
          total_sold: 10,
          total_revenue: 500,
        },
        {
          product_id: '2',
          product_name: 'Produto B',
          total_sold: 5,
          total_revenue: 250,
        },
      ];

      mockQueryRunner.manager.query = jest
        .fn()
        .mockResolvedValue(mockSalesData);
      mockQueryRunner.manager.save = jest.fn().mockResolvedValue({
        id: 'report1',
        file_path: 'reports/sales_report.csv',
      });
      jest
        .spyOn(service as any, 'createCSVFile')
        .mockReturnValue('reports/sales_report.csv');

      const result = await service.generateSalesReport(
        mockStartDate,
        mockEndDate,
      );

      expect(result).toBeDefined();
      expect(result.file_path).toBe('reports/sales_report.csv');
      expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(
        expect.any(String),
        [mockStartDate, mockEndDate],
      );
    });

    it('Deve lançar NotFoundException se não houverem vendas', async () => {
      mockQueryRunner.manager.query = jest.fn().mockResolvedValue([]);

      await expect(
        service.generateSalesReport(new Date(), new Date()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCSVFile', () => {
    it('Deve criar um arquivo CSV corretamente', () => {
      const mockData = [
        {
          product_id: '1',
          product_name: 'Produto A',
          total_sold: 10,
          total_revenue: 500,
        },
      ];
      const mockStartDate = new Date('2025-01-01');
      const mockEndDate = new Date('2025-01-31');
      const reportsDir = path.join(process.cwd(), 'reports');
      const fileName = `sales_report_2025-01-01_to_2025-01-31.csv`;
      const filePath = path.join(reportsDir, fileName);

      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'mkdirSync').mockImplementation();
      jest.spyOn(fs, 'writeFileSync').mockImplementation();

      const result = (service as any).createCSVFile(
        mockData,
        mockStartDate,
        mockEndDate,
      );
      expect(result).toBe(filePath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(reportsDir, {
        recursive: true,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        expect.any(String),
        expect.objectContaining({ flag: 'w' }),
      );
    });
  });

  describe('getReport', () => {
    it('Deve retornar um relatório específico', async () => {
      const mockReport = {
        id: 'report1',
        file_path: 'reports/sales_report.csv',
      };
      reportsRepository.findOne = jest.fn().mockResolvedValue(mockReport);

      const result = await service.getReport('report1');
      expect(result).toBeDefined();
      expect(result.id).toBe('report1');
    });

    it('Deve lançar NotFoundException se o relatório não existir', async () => {
      reportsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getReport('report1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listReports', () => {
    it('Deve listar todos os relatórios', async () => {
      const mockReports = [
        { id: 'report1', file_path: 'reports/sales_report_1.csv' },
        { id: 'report2', file_path: 'reports/sales_report_2.csv' },
      ];
      reportsRepository.find = jest.fn().mockResolvedValue(mockReports);

      const result = await service.listReports();
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('report1');
    });
  });
});
