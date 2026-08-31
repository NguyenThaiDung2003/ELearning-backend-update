import { Request } from "express";

import { badRequest } from "./errors";

/** Express 5 co the tra ve mang cho route param, chuan hoa ve mot chuoi. */
export const getParam = (req: Request, name: string) => {
  const raw = req.params[name];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (!value) {
    throw badRequest(`Thieu tham so ${name}`);
  }

  return value;
};
