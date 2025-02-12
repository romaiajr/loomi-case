import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@guards/role.guard';
import { Roles } from '@decorators/roles.decorator';
import { UserType } from '@enums/user-type';
import { ReportService } from './report.service';
import { ReportDTO } from './response/report.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @ApiResponse({ type: ReportDTO })
  @ApiQuery({ name: 'startDate', type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', type: String, example: '2024-02-01' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Post()
  async generateReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ReportDTO> {
    return this.reportService.generateSalesReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @ApiResponse({ type: ReportDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do Pedido' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Get(':id')
  async getReport(@Param('id') reportId: string): Promise<ReportDTO> {
    return this.reportService.getReport(reportId);
  }

  @ApiResponse({ type: [ReportDTO] })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Get()
  async listReports(): Promise<ReportDTO[]> {
    return this.reportService.listReports();
  }

  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do Relatório' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Get(':id/download')
  async downloadReport(@Param('id') reportId: string, @Res() res: Response) {
    const report = await this.reportService.getReport(reportId);
    if (!fs.existsSync(report.file_path)) {
      throw new NotFoundException('Arquivo não encontrado.');
    }
    res.download(report.file_path);
  }
}
