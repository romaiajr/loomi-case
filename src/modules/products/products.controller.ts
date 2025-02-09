import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '@decorators/roles.decorator';
import { UserType } from '@enums/user-type';
import { RolesGuard } from '@guards/role.guard';
import { AuthGuard } from '@nestjs/passport';
import { CreateProductDTO } from './model/request/create-product.dto';
import { UpdateProductDTO } from './model/request/update-product.dto';
import { ProductDTO } from './model/response/product.dto';
import { ProductPaginationResponse } from './model/response/product-pagination';
import { ProductsService } from './product..service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @ApiResponse({ type: ProductDTO })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Post()
  async create(
    @Body() createProductData: CreateProductDTO,
    @Res() res: Response,
  ) {
    const product: ProductDTO =
      await this.productsService.create(createProductData);
    return res.status(HttpStatus.CREATED).send(product);
  }

  @ApiResponse({ type: ProductPaginationResponse })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (default: 1)',
  })
  @ApiQuery({
    name: 'records',
    required: false,
    type: Number,
    description: 'Quantidade de registros por página (default: 5)',
  })
  @ApiQuery({
    name: 'onlyAvailable',
    required: false,
    type: Boolean,
    description:
      'Se verdadeiro, retorna apenas produtos disponíveis (default: true)',
  })
  @ApiQuery({
    name: 'priceLowerThan',
    required: false,
    type: Number,
    description: 'Filtra produtos com preço menor que o valor especificado',
  })
  @ApiQuery({
    name: 'priceBiggetThan',
    required: false,
    type: Number,
    description: 'Filtra produtos com preço maior que o valor especificado',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.CLIENT)
  @Get()
  async findAll(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('records') records: number = 5,
    @Query('onlyAvailable') onlyAvailable: boolean = true,
    @Query('priceLowerThan') priceLowerThan?: number,
    @Query('priceBiggetThan') priceBiggetThan?: number,
  ) {
    const products: ProductPaginationResponse =
      await this.productsService.findAll(page, records, {
        onlyAvailable,
        priceLowerThan,
        priceBiggetThan,
      });
    return res.status(HttpStatus.OK).send(products);
  }

  @ApiResponse({ type: ProductDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do produto' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.CLIENT)
  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') productId: string) {
    const product: ProductDTO = await this.productsService.findOne(productId);
    return res.status(HttpStatus.OK).send(product);
  }

  @ApiResponse({ type: ProductDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do produto' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Put(':id')
  async update(
    @Body() updateProductData: UpdateProductDTO,
    @Res() res: Response,
    @Param('id') productId: string,
  ) {
    const updatedProduct: ProductDTO = await this.productsService.update(
      productId,
      updateProductData,
    );
    return res.status(HttpStatus.OK).send(updatedProduct);
  }

  @ApiResponse({ status: HttpStatus.OK })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do produto' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') productId: string) {
    await this.productsService.remove(productId);
    return res.status(HttpStatus.OK).send('O produto foi removido');
  }
}
