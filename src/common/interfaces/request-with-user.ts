import { Request } from 'express';
import { JwtPayload } from 'src/modules/auth/model/jwt-payload';

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
