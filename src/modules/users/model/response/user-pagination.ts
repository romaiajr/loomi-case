import { PaginationResponse } from '@interfaces/pagination-response';
import { UserDTO } from './user.dto';
import { CustomerDTO } from './customer.dto';

export class UserPaginationResponse
  implements PaginationResponse<{ customers: CustomerDTO[]; admins: UserDTO[] }>
{
  items: {
    customers: CustomerDTO[];
    admins: UserDTO[];
  };
  page: number;
  records: number;
  total: number;
  lastElement: boolean;

  constructor(
    items: { customers: CustomerDTO[]; admins: UserDTO[] },
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
