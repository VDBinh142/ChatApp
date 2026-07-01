/// <reference path="../types/express.d.ts" />
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { KnownErrors } from "../errors";

export const verifyToken = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    throw new KnownErrors("ERR_UNAUTHORIZED");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { username: string };
    req.username = decoded.username;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new KnownErrors("ERR_AUTH_TOKEN_EXPIRED");
    }
    throw new KnownErrors("ERR_UNAUTHORIZED");
  }
};
