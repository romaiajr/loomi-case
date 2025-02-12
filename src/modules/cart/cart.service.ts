import { Cart } from '@entities/cart';
import { CartItem } from '@entities/cart-item';
import { Product } from '@entities/product';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartDTO } from './response/cart.dto';
import { runInTransaction } from '@utils/run-in-transaction';
import { User } from '@entities/user';
import { CartItemDTO } from './request/cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  private toDTO(cart: Cart): CartDTO {
    const cartDto = new CartDTO();
    cartDto.id = cart.id;
    cartDto.amount =
      cart.items?.reduce((total, item) => total + item.amount, 0) || 0;
    cartDto.items =
      cart.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        amount: item.amount,
        product_id: item.product.id,
      })) || [];
    return cartDto;
  }

  private async getCartEntity(userId: string): Promise<Cart | null> {
    return this.cartsRepository.findOne({
      relations: ['items', 'items.product'],
      where: { user: { id: userId } },
    });
  }

  private async getProduct(productId: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Produto Não Encontrado');
    return product;
  }

  private async getExistentCartItem(
    cartId: string,
    productId: string,
  ): Promise<CartItem | null> {
    return this.cartItemsRepository.findOne({
      where: { product: { id: productId }, cart: { id: cartId } },
      relations: ['product'],
    });
  }

  private async getOrCreateCart(userId: string): Promise<Cart> {
    return (
      (await this.getCartEntity(userId)) ?? (await this.createCart(userId))
    );
  }

  private async createCart(userId: string): Promise<Cart> {
    return runInTransaction(this.dataSource, async (manager) => {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) throw new NotFoundException('Usuário Não Encontrado');

      const newCart = manager.create(Cart, { items: [], user });
      return await manager.save(Cart, newCart);
    });
  }

  async getCart(userId: string): Promise<CartDTO> {
    return this.toDTO(await this.getOrCreateCart(userId));
  }

  async addItemToCart(userId: string, cartItem: CartItemDTO): Promise<CartDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const cart = await this.getOrCreateCart(userId);
      const item = await this.getExistentCartItem(cart.id, cartItem.product_id);

      if (item) {
        item.quantity += cartItem.quantity;
        const updatedCartItem = await manager.save(CartItem, item);
        cart.items = cart.items.map((i) =>
          i.id === updatedCartItem.id ? updatedCartItem : i,
        );
      } else {
        const product = await this.getProduct(cartItem.product_id);
        const newCartItem = manager.create(CartItem, {
          cart,
          product,
          price_per_unit: product.price,
          quantity: cartItem.quantity,
        });
        const savedCartItem = await manager.save(CartItem, newCartItem);
        cart.items = [...cart.items, savedCartItem];
      }

      return this.toDTO(cart);
    });
  }

  async updateCartItem(
    userId: string,
    updateCart: CartItemDTO,
  ): Promise<CartDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const cart = await this.getCartEntity(userId);
      if (!cart)
        throw new NotFoundException(
          'Nenhum carrinho em aberto para este usuário',
        );

      const item = await this.getExistentCartItem(
        cart.id,
        updateCart.product_id,
      );
      if (item) {
        item.quantity = updateCart.quantity;
        const updatedCartItem = await manager.save(CartItem, item);
        cart.items = cart.items.map((i) =>
          i.id === updatedCartItem.id ? updatedCartItem : i,
        );
      } else {
        const product = await this.getProduct(updateCart.product_id);
        const newCartItem = manager.create(CartItem, {
          cart,
          product,
          price_per_unit: product.price,
          quantity: updateCart.quantity,
        });
        const savedCartItem = await manager.save(CartItem, newCartItem);
        cart.items = [...cart.items, savedCartItem];
      }

      return this.toDTO(cart);
    });
  }

  async removeItemFromCart(userId: string, itemId: string): Promise<CartDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const cart = await this.getCartEntity(userId);
      if (!cart) {
        throw new NotFoundException(
          'Nenhum carrinho em aberto para este usuário',
        );
      }
      const item = await this.cartItemsRepository.findOne({
        where: { id: itemId, cart: { id: cart.id } },
        relations: ['product'],
      });
      if (!item) {
        return this.toDTO(cart);
      }
      await manager.delete(CartItem, { id: item.id });
      cart.items = cart.items.filter((i) => i.id !== item.id);
      return this.toDTO(cart);
    });
  }

  async deleteCart(userId: string): Promise<void> {
    const cart = await this.getCartEntity(userId);
    if (cart) await this.cartsRepository.delete({ id: cart.id });
  }
}
