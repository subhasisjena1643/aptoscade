import * as jwt from 'jsonwebtoken';

export const signToken = (payload: object, secret: string, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret);
};
