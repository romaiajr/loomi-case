import { Product } from '@entities/product';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './product..service';
import { ProductDTO } from './model/response/product.dto';
import { CreateProductDTO } from './model/request/create-product.dto';
import { UpdateProductDTO } from './model/request/update-product.dto';
import { ProductPaginationResponse } from './model/response/product-pagination';

const mockProductRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(getRepositoryToken(Product));
  });

  describe('create', () => {
    it('Deve criar um produto', async () => {
      const productDto: CreateProductDTO = {
        name: 'Produto Exemplo',
        description: 'Exemplo de um produto',
        price: 5,
        stock_quantity: 20,
      };

      mockQueryRunner.manager.create = jest
        .fn()
        .mockReturnValue(productDto as Product);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ ...productDto, id: '123' } as Product);

      const result = await service.create(productDto);
      expect(result).toBeInstanceOf(ProductDTO);
      expect(result).toEqual(
        expect.objectContaining({
          id: '123',
          name: 'Produto Exemplo',
          description: 'Exemplo de um produto',
          price: 5,
          stock_quantity: 20,
        }),
      );
    });
  });

  describe('update', () => {
    it('Deve atualizar um usuário comum', async () => {
      const existentProduct = {
        id: '123',
        name: 'Produto Exemplo',
        description: 'Exemplo de um produto',
        price: 5,
        stock_quantity: 20,
      } as Product;

      const updateDto: UpdateProductDTO = {
        name: 'Produto Exemplo 2',
        description: 'Exemplo de um produto',
        price: 10,
        stock_quantity: 20,
      };

      productRepository.findOne = jest.fn().mockResolvedValue(existentProduct);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ ...existentProduct, ...updateDto });

      const result = await service.update('123', updateDto);

      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ProductDTO);
      expect(result.name).toBe(updateDto.name);
      expect(result.price).toBe(updateDto.price);
      expect(result.description).toBe(existentProduct.description);
      expect(result.stock_quantity).toBe(existentProduct.stock_quantity);
    });
  });

  describe('findAll', () => {
    it('deve retornar produtos paginados', async () => {
      const page = 1;
      const records = 2;

      const products = [
        {
          id: '1',
          name: 'Produto Exemplo 1',
          description: 'Exemplo de um produto 1',
          price: 1,
          stock_quantity: 10,
        },
        {
          id: '2',
          name: 'Produto Exemplo 2',
          description: 'Exemplo de um produto 2 ',
          price: 2,
          stock_quantity: 20,
        },
        {
          id: '3',
          name: 'Produto Exemplo 3',
          description: 'Exemplo de um produto 3',
          price: 3,
          stock_quantity: 30,
        },
        {
          id: '4',
          name: 'Produto Exemplo 4',
          description: 'Exemplo de um produto 4',
          price: 4,
          stock_quantity: 40,
        },
      ];

      productRepository.find = jest
        .fn()
        .mockResolvedValue(products.slice(0, records));
      productRepository.count = jest.fn().mockResolvedValue(products.length);

      const result = await service.findAll(page, records, {});

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 2,
        }),
      );

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(products.length);
      expect(result.page).toBe(page);
      expect(result.records).toBe(records);
      expect(result.lastElement).toBe(false);
      expect(result).toBeInstanceOf(ProductPaginationResponse);
    });

    it('deve retornar `lastElement: true` na última página', async () => {
      const page = 2;
      const records = 2;

      const products = [
        {
          id: '1',
          name: 'Produto Exemplo 1',
          description: 'Exemplo de um produto 1',
          price: 1,
          stock_quantity: 10,
        },
        {
          id: '2',
          name: 'Produto Exemplo 2',
          description: 'Exemplo de um produto 2 ',
          price: 2,
          stock_quantity: 20,
        },
        {
          id: '3',
          name: 'Produto Exemplo 3',
          description: 'Exemplo de um produto 3',
          price: 3,
          stock_quantity: 30,
        },
        {
          id: '4',
          name: 'Produto Exemplo 4',
          description: 'Exemplo de um produto 4',
          price: 4,
          stock_quantity: 40,
        },
      ];

      productRepository.find = jest
        .fn()
        .mockResolvedValue(products.slice(2, 4));
      productRepository.count = jest.fn().mockResolvedValue(products.length);

      const result = await service.findAll(page, records, {
        onlyAvailable: true,
      });

      expect(result.lastElement).toBe(true);
    });

    it('deve retornar um array vazio se não houver produtos na página', async () => {
      productRepository.find = jest.fn().mockResolvedValue([]);
      productRepository.count = jest.fn().mockResolvedValue(0);

      const result = await service.findAll(1, 10, { onlyAvailable: true });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.lastElement).toBe(true);
    });

    it('Deve aplicar o filtro onlyAvailable corretamente', async () => {
      productRepository.find = jest.fn().mockResolvedValue([]);
      productRepository.count = jest.fn().mockResolvedValue(0);

      await service.findAll(1, 10, { onlyAvailable: true });

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock_quantity: MoreThan(0),
          }),
        }),
      );
    });

    it('Deve aplicar o filtro de faixa de preço corretamente', async () => {
      productRepository.find = jest.fn().mockResolvedValue([]);
      productRepository.count = jest.fn().mockResolvedValue(0);

      await service.findAll(1, 10, { minPrice: 100, maxPrice: 500 });

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: Between(100, 500),
          }),
        }),
      );
    });

    it('Deve aplicar o filtro minPrice corretamente', async () => {
      productRepository.find = jest.fn().mockResolvedValue([]);
      productRepository.count = jest.fn().mockResolvedValue(0);

      await service.findAll(1, 10, { minPrice: 200 });

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: MoreThanOrEqual(200),
          }),
        }),
      );
    });

    it('Deve aplicar o filtro maxPrice corretamente', async () => {
      productRepository.find = jest.fn().mockResolvedValue([]);
      productRepository.count = jest.fn().mockResolvedValue(0);

      await service.findAll(1, 10, { maxPrice: 300 });

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: LessThanOrEqual(300),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar um produto pelo ID', async () => {
      const product = {
        id: '1',
        name: 'Produto Exemplo 1',
        description: 'Exemplo de um produto 1',
        price: 1,
        stock_quantity: 10,
      };
      productRepository.findOne = jest.fn().mockResolvedValue(product);

      const result = await service.findOne('123');

      expect(result).toBeInstanceOf(ProductDTO);
      expect(result.id).toBe('1');
    });

    it('deve lançar erro ao buscar um usuário inexistente', async () => {
      productRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve inativar um produto', async () => {
      const product = {
        id: '1',
        name: 'Produto Exemplo 1',
        description: 'Exemplo de um produto 1',
        price: 1,
        stock_quantity: 10,
      };
      productRepository.findOne = jest.fn().mockResolvedValue(product);
      productRepository.update = jest.fn().mockResolvedValue(undefined);

      await service.remove('1');

      expect(productRepository.update).toHaveBeenCalledWith(
        '1',
        expect.any(Object),
      );
    });
  });
});
