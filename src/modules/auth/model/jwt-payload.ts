import { UserType } from '@enums/user-type';

export interface JwtPayload {
  sub: string;
  username: string;
  type: UserType;
}
