import { PaginationResponse } from '@interfaces/pagination-response';
import { ProductDTO } from './product.dto';

export class ProductPaginationResponse
  implements PaginationResponse<ProductDTO[]>
{
  items: ProductDTO[];
  page: number;
  records: number;
  total: number;
  lastElement: boolean;

  constructor(
    items: ProductDTO[],
    page: number,
    records: number,
    total: number,
    lastElement: boolean,
  ) {
    this.items = items;
    this.page = page;
    this.records = records;
    this.total = total;
    this.lastElement = lastElement;
  }
}
