import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { runInTransaction } from '@utils/run-in-transaction';
import { Product } from '@entities/product';
import { ProductDTO } from './model/response/product.dto';
import { CreateProductDTO } from './model/request/create-product.dto';
import { ProductPaginationResponse } from './model/response/product-pagination';
import { UpdateProductDTO } from './model/request/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  toDTO(product: Product): ProductDTO {
    const productDto = new ProductDTO();
    productDto.id = product.id;
    productDto.name = product.name;
    productDto.description = product.description;
    productDto.price = product.price;
    productDto.stock_quantity = product.stock_quantity;
    return productDto;
  }

  async create(product: CreateProductDTO): Promise<ProductDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const createdProduct = manager.create(Product, product);
      const savedProduct = await manager.save(Product, createdProduct);
      return this.toDTO(savedProduct);
    });
  }

  async findAll(
    page: number,
    records: number,
    filters: {
      onlyAvailable: boolean;
      priceLowerThan?: number;
      priceBiggetThan?: number;
    },
  ): Promise<ProductPaginationResponse> {
    // TODO - Faltando lidar com os filtros

    const skip: number = page ? (page - 1) * records : 0;
    const take: number = records ? records : 10;
    const products = await this.productsRepository.find({
      skip,
      take,
    });

    const totalCount = await this.productsRepository.count();

    return new ProductPaginationResponse(
      products.map((product) => this.toDTO(product)),
      page,
      records,
      totalCount,
      records * page >= totalCount,
    );
  }

  async findOneProduct(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  async findOne(id: string): Promise<ProductDTO> {
    const product = await this.findOneProduct(id);
    return this.toDTO(product);
  }

  async remove(id: string): Promise<void> {
    await this.findOneProduct(id);
    const currentDate = new Date().toISOString();
    await this.productsRepository.update(id, {
      is_active: false,
      inactivated_at: currentDate,
    });
  }

  async update(
    productId: string,
    updateData: UpdateProductDTO,
  ): Promise<ProductDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await this.findOneProduct(productId);
      Object.assign(product, updateData);
      await manager.save(Product, product);
      return this.toDTO(product);
    });
  }
}
