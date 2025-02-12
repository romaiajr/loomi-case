import { Cart } from '@entities/cart';
import { CartService } from './cart.service';
import { CartItem } from '@entities/cart-item';
import { User } from '@entities/user';
import { Product } from '@entities/product';
import { DataSource, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartDTO } from './response/cart.dto';

const mockCartRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};

const mockCartItemRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};
const mockProductRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};
const mockUserRepository = {
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
    delete: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

describe('CartService', () => {
  let service: CartService;
  let cartRepository: Repository<Cart>;
  let cartItemsRepository: Repository<CartItem>;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: mockCartRepository,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: mockCartItemRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(getRepositoryToken(Cart));
    cartItemsRepository = module.get(getRepositoryToken(CartItem));
    userRepository = module.get(getRepositoryToken(User));
    productRepository = module.get(getRepositoryToken(Product));
  });

  describe('Get Cart', () => {
    it('Should get a cart linked with user', async () => {
      const cart = {
        id: '123',
        items: [],
      };

      cartRepository.findOne = jest.fn().mockResolvedValue(cart);
      const result = await service.getCart('123');
      expect(result).toBeInstanceOf(CartDTO);
    });

    it('Should create a cart when none is linked to user', async () => {
      const user = {
        id: '123',
        email: 'teste@email.com',
        name: 'Fulano de Tal',
        type: 0,
      } as User;
      const cart = {};

      cartRepository.findOne = jest.fn().mockResolvedValue(null);
      userRepository.findOne = jest.fn().mockResolvedValue(user);
      mockQueryRunner.manager.create = jest.fn().mockResolvedValue(cart);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ id: '123', ...cart });
      const result = await service.getCart('123');
      expect(result).toBeInstanceOf(CartDTO);
      expect(result.items).toEqual([]);
    });
  });

  describe('Delete Cart', () => {
    it('Should delete cart', async () => {
      const cart = {
        id: '123',
      };
      cartRepository.findOne = jest.fn().mockResolvedValue(cart);
      cartRepository.delete = jest.fn().mockResolvedValue(undefined);

      await service.deleteCart('123');
    });
  });

  describe('Remove Item From Cart', () => {
    it('should remove item from cart', async () => {
      const cart = {
        id: 'carrinho-123',
        amount: 170,
        items: [
          {
            id: 'item-1',
            quantity: 2,
            price_per_unit: 50,
            amount: 100,
            product: {
              id: 'product-ghi',
              name: 'Headphones',
              description: 'Wireless headphones',
              price: 10,
              stock_quantity: 15,
              is_active: true,
              items: [],
            },
          },
          {
            id: 'item-2',
            quantity: 3,
            price_per_unit: 20,
            amount: 60,
            product: {
              id: 'product-def',
              name: 'Laptop',
              description: 'Gaming laptop',
              price: 20,
              stock_quantity: 5,
              is_active: true,
              items: [],
            },
          },
        ],
      };
      cartRepository.findOne = jest.fn().mockResolvedValue(cart);
      cartItemsRepository.findOne = jest.fn().mockResolvedValue(cart.items[0]);
      cartItemsRepository.delete = jest.fn().mockResolvedValue(undefined);

      const result = await service.removeItemFromCart('123', 'item-1');
      expect(result.items).toEqual([
        {
          id: cart.items[0].id,
          quantity: cart.items[0].quantity,
          price_per_unit: cart.items[0].price_per_unit,
          amount: cart.items[0].amount,
          product_id: cart.items[0].product.id,
        },
      ]);
    });
  });

  describe('Add Item To Cart', () => {
    it('Should add a new item to Cart', async () => {
      const cart = {
        id: '123',
        items: [],
      };
      const product = {
        id: 'product-abc',
        name: 'Smartphone',
        description: 'High-end smartphone',
        price: 50,
        stock_quantity: 10,
        inactivated_at: null,
        is_active: true,
        items: [],
      };
      const cartItem = {
        amount: 500,
        quantity: 10,
        price_per_unit: product.price,
        product: product,
        cart: null,
      };
      cartRepository.findOne = jest.fn().mockResolvedValue(cart);
      cartItemsRepository.findOne = jest.fn().mockResolvedValue(undefined);
      productRepository.findOne = jest.fn().mockResolvedValue(product);
      mockQueryRunner.manager.create = jest.fn().mockResolvedValue(cartItem);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ id: '123', ...cartItem });

      const result = await service.addItemToCart('123', {
        product_id: 'product-abc',
        quantity: 10,
      });

      expect(result).toBeInstanceOf(CartDTO);
      expect(result.items).toEqual([
        {
          id: '123',
          quantity: 10,
          price_per_unit: 50,
          amount: 500,
          product_id: 'product-abc',
        },
      ]);
      expect(result.amount).toEqual(500);
    });
    it('Should update item from Cart if item is already in cart', async () => {
      const product = {
        id: 'product-abc',
        name: 'Smartphone',
        description: 'High-end smartphone',
        price: 50,
        stock_quantity: 10,
        inactivated_at: null,
        is_active: true,
        items: [],
      };
      const cartItem = {
        id: '123',
        amount: 500,
        quantity: 10,
        price_per_unit: product.price,
        product: product,
        cart: null,
      };
      const cart = {
        id: '123',
        items: [cartItem],
      };
      cartRepository.findOne = jest.fn().mockResolvedValue(cart);
      cartItemsRepository.findOne = jest.fn().mockResolvedValue(cartItem);
      mockQueryRunner.manager.save = jest.fn().mockResolvedValue(cartItem);

      const result = await service.addItemToCart('123', {
        product_id: 'product-abc',
        quantity: 10,
      });

      expect(result).toBeInstanceOf(CartDTO);
      expect(result.items).toEqual([
        {
          id: '123',
          quantity: 20,
          price_per_unit: 50,
          amount: 500,
          product_id: 'product-abc',
        },
      ]);
      expect(result.amount).toEqual(500);
    });
  });

  describe('Update Item From Cart', () => {
    it('Should add a new item to Cart if the updated item doesnt exist', async () => {
      const cart = {
        id: '123',
        items: [],
      };
      const product = {
        id: 'product-abc',
        name: 'Smartphone',
        description: 'High-end smartphone',
        price: 50,
        stock_quantity: 10,
        inactivated_at: null,
        is_active: true,
        items: [],
      };
      const cartItem = {
        amount: 500,
        quantity: 10,
        price_per_unit: product.price,
        product: product,
        cart: null,
      };
      cartRepository.findOne = jest.fn().mockResolvedValue(cart);
      cartItemsRepository.findOne = jest.fn().mockResolvedValue(undefined);
      productRepository.findOne = jest.fn().mockResolvedValue(product);
      mockQueryRunner.manager.create = jest.fn().mockResolvedValue(cartItem);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ id: '123', ...cartItem });

      const result = await service.updateCartItem('123', {
        product_id: 'product-abc',
        quantity: 10,
      });

      expect(result).toBeInstanceOf(CartDTO);
      expect(result.items).toEqual([
        {
          id: '123',
          quantity: 10,
          price_per_unit: 50,
          amount: 500,
          product_id: 'product-abc',
        },
      ]);
      expect(result.amount).toEqual(500);
    });

    it('Should update item from Cart if item is already in cart', async () => {
      const product = {
        id: 'product-abc',
        name: 'Smartphone',
        description: 'High-end smartphone',
        price: 50,
        stock_quantity: 10,
        inactivated_at: null,
        is_active: true,
        items: [],
      };
      const cartItem = {
        id: '123',
        amount: 500,
        quantity: 10,
        price_per_unit: product.price,
        product: product,
        cart: null,
      };
      const updatedCartItem = {
        id: '123',
        amount: 500,
        quantity: 20,
        price_per_unit: product.price,
        product: product,
      };
      const cart = {
        id: '123',
        items: [cartItem],
      };
      cartRepository.findOne = jest.fn().mockResolvedValue(cart);
      cartItemsRepository.findOne = jest.fn().mockResolvedValue(cartItem);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue(updatedCartItem);

      const result = await service.updateCartItem('123', {
        product_id: 'product-abc',
        quantity: 10,
      });

      expect(result).toBeInstanceOf(CartDTO);
      expect(result.items).toEqual([
        {
          id: '123',
          quantity: 20,
          price_per_unit: 50,
          amount: 500,
          product_id: 'product-abc',
        },
      ]);
      expect(result.amount).toEqual(500);
    });
  });
});
