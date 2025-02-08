import { PaginationResponse } from 'src/common/interfaces/pagination-response';
import { UserDTO } from './user.dto';
import { ClientDTO } from './client.dto';

export class UserPaginationResponse
  implements PaginationResponse<{ clients: ClientDTO[]; admins: UserDTO[] }>
{
  items: {
    clients: ClientDTO[];
    admins: UserDTO[];
  };
  page: number;
  records: number;
  total: number;
  lastElement: boolean;

  constructor(
    items: { clients: ClientDTO[]; admins: UserDTO[] },
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
