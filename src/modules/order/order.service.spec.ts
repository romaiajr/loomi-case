import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from '@entities/cart';
import { Order } from '@entities/order';
import { Product } from '@entities/product';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrderStatus } from '@enums/order-status';
import { OrderService } from './order.service';
import { PaymentStatus } from '@enums/payment-status';

describe('OrderService', () => {
  let service: OrderService;
  let ordersRepository: Repository<Order>;
  let cartsRepository: Repository<Cart>;
  let productsRepository: Repository<Product>;

  const mockOrdersRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockCartsRepository = {
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
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
      delete: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrdersRepository },
        { provide: getRepositoryToken(Cart), useValue: mockCartsRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    ordersRepository = module.get(getRepositoryToken(Order));
    cartsRepository = module.get(getRepositoryToken(Cart));
    productsRepository = module.get(getRepositoryToken(Product));
  });

  describe('createOrder', () => {
    it('Deve criar um pedido corretamente', async () => {
      const mockCart = {
        id: 'cart1',
        user: { id: 'user1' },
        items: [{ product: { id: 'prod1', stock_quantity: 5 }, quantity: 2 }],
      } as Cart;

      const mockProduct = {
        id: 'prod1',
        stock_quantity: 5,
        decreaseStock: jest.fn(),
      };

      const mockOrderItem = {
        id: 'orderItem1',
        quantity: 2,
        price_per_unit: 50,
        amount: 100,
        product: mockProduct,
      };

      const mockOrder = {
        id: 'order1',
        items: [],
        order_status: OrderStatus.PROCESSING,
      };
      cartsRepository.findOne = jest.fn().mockResolvedValue(mockCart);
      productsRepository.findOne = jest.fn().mockResolvedValue(mockProduct);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValue(mockOrderItem);

      const result = await service.createOrder('user1');

      expect(result).toBeDefined();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(productsRepository.findOne).toHaveBeenCalled();
      expect(mockProduct.decreaseStock).toHaveBeenCalledWith(2);
    });

    it('Deve falhar se o carrinho não existir', async () => {
      cartsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.createOrder('user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Deve falhar se o carrinho estiver vazio', async () => {
      cartsRepository.findOne = jest.fn().mockResolvedValue({
        id: 'cart1',
        user: { id: 'user1' },
        items: [],
      });

      await expect(service.createOrder('user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Deve falhar se algum produto estiver fora de estoque', async () => {
      cartsRepository.findOne = jest.fn().mockResolvedValue({
        id: 'cart1',
        user: { id: 'user1' },
        items: [{ product: { id: 'prod1', stock_quantity: 0 }, quantity: 2 }],
      });

      productsRepository.findOne = jest.fn().mockResolvedValue({
        id: 'prod1',
        stock_quantity: 0,
      });

      await expect(service.createOrder('user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Deve falhar se algum produto não tiver estoque suficiente', async () => {
      cartsRepository.findOne = jest.fn().mockResolvedValue({
        id: 'cart1',
        user: { id: 'user1' },
        items: [{ product: { id: 'prod1', stock_quantity: 1 }, quantity: 2 }],
      });

      productsRepository.findOne = jest.fn().mockResolvedValue({
        id: 'prod1',
        stock_quantity: 1,
      });

      await expect(service.createOrder('user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getOrders', () => {
    it('Deve retornar pedidos paginados corretamente', async () => {
      ordersRepository.find = jest
        .fn()
        .mockResolvedValue([{ id: 'order1' }, { id: 'order2' }]);
      ordersRepository.count = jest.fn().mockResolvedValue(2);

      const result = await service.getOrders('user1', 1, 10);

      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
    });
  });

  describe('findOneOrder', () => {
    it('Deve encontrar um pedido existente', async () => {
      ordersRepository.findOne = jest.fn().mockResolvedValue({ id: 'order1' });

      const result = await service.findOneOrder('user1', 'order1');

      expect(result).toBeDefined();
      expect(result.id).toBe('order1');
    });

    it('Deve falhar se o pedido não for encontrado', async () => {
      ordersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOneOrder('user1', 'order1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOrder', () => {
    it('Deve retornar um pedido específico como DTO', async () => {
      const mockOrder = { id: 'order1', items: [] };
      ordersRepository.findOne = jest.fn().mockResolvedValue(mockOrder);

      const result = await service.getOrder('user1', 'order1');

      expect(result).toBeDefined();
      expect(result.id).toBe('order1');
    });
  });

  describe('cancelOrder', () => {
    it('Deve cancelar um pedido e devolver os produtos ao estoque', async () => {
      const mockProduct = {
        id: 'prod1',
        stock_quantity: 10,
        increaseStock: jest.fn(),
      };

      const mockIncreasedProduct = {
        id: 'prod1',
        stock_quantity: 12,
        increaseStock: jest.fn(),
      };

      const mockOrderItem = {
        id: 'orderItem1',
        quantity: 2,
        price_per_unit: 50,
        amount: 100,
        product: mockProduct,
      };

      const mockOrder = {
        id: 'order1',
        items: [mockOrderItem],
        order_status: OrderStatus.PROCESSING,
      };

      const mockCanceledOrder = {
        id: 'order1',
        items: [mockOrderItem],
        order_status: OrderStatus.CANCELED,
      };

      ordersRepository.findOne = jest.fn().mockResolvedValue(mockOrder);
      productsRepository.findOne = jest.fn().mockResolvedValue(mockProduct);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValueOnce(mockIncreasedProduct)
        .mockResolvedValueOnce(mockCanceledOrder);
      const result = await service.cancelOrder('user1', 'order1');

      expect(result).toBeDefined();
      expect(result.order_status).toBe(OrderStatus.CANCELED);
      expect(mockProduct.increaseStock).toHaveBeenCalledWith(2);
    });

    it('Deve falhar se o pedido não existir', async () => {
      ordersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('payOrder', () => {
    it('Deve aprovar o pagamento e atualizar o status do pedido', async () => {
      const mockOrder = {
        id: 'order1',
        user: { id: 'user1' },
        order_status: OrderStatus.RECEIVED,
        payment_status: null,
        items: [],
      };

      const mockUpdatedOrder = {
        ...mockOrder,
        order_status: OrderStatus.PROCESSING,
        payment_status: PaymentStatus.APPROVED,
      };

      ordersRepository.findOne = jest.fn().mockResolvedValue(mockOrder);
      ordersRepository.save = jest.fn().mockResolvedValue(mockUpdatedOrder);
      jest.spyOn(global.Math, 'random').mockReturnValue(0.7);

      const result = await service.payOrder('user1', {
        order_id: 'order1',
        payment_info: {
          name: 'John Doe',
          card_number: '1234123412341234',
          expiration_date: {
            month: 12,
            year: 2028,
          },
          cvv: '123',
        },
      });

      expect(result).toBeDefined();
      expect(result.payment_status).toBe(PaymentStatus.APPROVED);
      expect(result.order_status).toBe(OrderStatus.PROCESSING);
      expect(ordersRepository.save).toHaveBeenCalledWith(mockUpdatedOrder);
    });

    it('Deve recusar o pagamento e lançar erro UnprocessableEntityException', async () => {
      const mockOrder = {
        id: 'order1',
        user: { id: 'user1' },
        order_status: OrderStatus.RECEIVED,
        payment_status: null,
      };

      const mockUpdatedOrder = {
        ...mockOrder,
        payment_status: PaymentStatus.DENIED,
      };

      ordersRepository.findOne = jest.fn().mockResolvedValue(mockOrder);
      ordersRepository.save = jest.fn().mockResolvedValue(mockUpdatedOrder);
      jest.spyOn(global.Math, 'random').mockReturnValue(0.2);

      await expect(
        service.payOrder('user1', {
          order_id: 'order1',
          payment_info: {
            name: 'John Doe',
            card_number: '1234123412341234',
            expiration_date: {
              month: 12,
              year: 2028,
            },
            cvv: '123',
          },
        }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(ordersRepository.save).toHaveBeenCalledWith(mockUpdatedOrder);
    });
  });
});
