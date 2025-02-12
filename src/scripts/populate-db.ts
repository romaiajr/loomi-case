import { DataSource, EntityManager } from 'typeorm';
import { User } from '@entities/user';
import { Customer } from '@entities/customer';
import { Product } from '@entities/product';
import { Order } from '@entities/order';
import { OrderItem } from '@entities/order-item';
import { Cart } from '@entities/cart';
import { CartItem } from '@entities/cart-item';
import { Report } from '@entities/report';
import { UserType } from '@enums/user-type';
import { OrderStatus } from '@enums/order-status';
import { PaymentStatus } from '@enums/payment-status';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import configuration from '@config/configuration';

config();

async function cleanDatabase(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    console.log('Cleaning database...');
    await queryRunner.query(`TRUNCATE TABLE "auth_code" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "cart_items" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "carts" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "customers" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "order_items" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "orders" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "products" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "reports" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "users" CASCADE`);
    console.log('Database cleaned successfully.');
    await seedDatabase(queryRunner.manager);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error while cleaning the database:', error);
  } finally {
    await queryRunner.release();
  }
}

const seedDatabase = async (manager: EntityManager) => {
  const adminUser = manager.create(User, {
    name: 'Admin User',
    email: 'admin@example.com',
    password: await bcrypt.hash('admin123', 10),
    type: UserType.ADMIN,
  });
  await manager.save(adminUser);

  const customerUser = manager.create(User, {
    name: 'Customer User',
    email: 'customer@example.com',
    password: await bcrypt.hash('customer123', 10),
    type: UserType.CUSTOMER,
  });
  await manager.save(customerUser);

  const customer = manager.create(Customer, {
    user: customerUser,
    contact: '(11) 99999-9999',
    address: 'Rua Exemplo, 123',
  });
  await manager.save(customer);

  const products = [
    { name: 'Produto A', price: 100, stock_quantity: 50 },
    { name: 'Produto B', price: 200, stock_quantity: 30 },
    { name: 'Produto C', price: 300, stock_quantity: 20 },
  ].map((p) => manager.create(Product, p));
  await manager.save(products);

  const cart = manager.create(Cart, { user: customerUser, items: [] });
  await manager.save(cart);

  const cartItems = [
    manager.create(CartItem, {
      cart,
      product: products[0],
      quantity: 2,
      price_per_unit: products[0].price,
    }),
    manager.create(CartItem, {
      cart,
      product: products[1],
      quantity: 1,
      price_per_unit: products[1].price,
    }),
  ];
  await manager.save(cartItems);

  const order = manager.create(Order, {
    user: customerUser,
    amount: 0,
    order_status: OrderStatus.PROCESSING,
    payment_status: PaymentStatus.PENDING,
    items: [],
  });
  await manager.save(order);

  const orderItems = cartItems.map((ci) =>
    manager.create(OrderItem, {
      order,
      product: ci.product,
      quantity: ci.quantity,
      price_per_unit: ci.price_per_unit,
    }),
  );
  await manager.save(orderItems);
};

const dbConfig = configuration();

const dataSource = new DataSource({
  database: dbConfig.database.name,
  username: dbConfig.database.user,
  password: dbConfig.database.pwd,
  host: dbConfig.database.host,
  port: Number(dbConfig.database.port || '5432'),
  type: 'postgres',
  synchronize: dbConfig.database.synchronize ?? true,
  entities: [User, Customer, Product, Cart, CartItem, Order, OrderItem, Report],
  logging: true,
});

dataSource
  .initialize()
  .then(async () => {
    console.log('Data Source initialized');
    console.log('Connected to database:', dbConfig.database.name);
    await cleanDatabase(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });
