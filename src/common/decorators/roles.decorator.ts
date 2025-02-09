import { UserType } from '@enums/user-type';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
