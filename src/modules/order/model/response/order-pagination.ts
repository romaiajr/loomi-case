import { PaginationResponse } from '@interfaces/pagination-response';
import { OrderDTO } from './order.dto';

export class OrderPaginationResponse implements PaginationResponse<OrderDTO[]> {
  items: OrderDTO[];
  page: number;
  records: number;
  total: number;
  lastElement: boolean;

  constructor(
    items: OrderDTO[],
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
