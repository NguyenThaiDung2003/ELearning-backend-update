import jwt, { Secret, SignOptions } from "jsonwebtoken";

export const signJwt = (
  payload: string | Buffer | object,
  secret: Secret,
  options?: SignOptions,
) => jwt.sign(payload, secret, options);

export const verifyJwt = <T>(token: string, secret: Secret) =>
  jwt.verify(token, secret) as T;
