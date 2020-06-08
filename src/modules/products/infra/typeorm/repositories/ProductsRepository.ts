import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const orderProductsList = products.map(product => product.id);
    const productsList = await this.ormRepository.find({
      id: In(orderProductsList),
    });

    if (orderProductsList.length !== productsList.length) {
      throw new AppError('One or more product is missing.');
    }

    return productsList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsList = await this.findAllById(products);

    const productsToUpdate = productsList.map(productList => {
      const productToUpdate = products.find(
        product => product.id === productList.id,
      );

      if (!productToUpdate) {
        throw new AppError('Product not found.');
      }

      if (productList.quantity < productToUpdate.quantity) {
        throw new AppError('Product quantity higher than stock quantity.');
      }

      const newProduct = productList;
      newProduct.quantity -= productToUpdate.quantity;

      return newProduct;
    });

    await this.ormRepository.save(productsToUpdate);

    return productsToUpdate;
  }
}

export default ProductsRepository;
