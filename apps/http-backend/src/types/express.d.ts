import { Request } from "express";
export {};

declare global {
  namespace Express {
    interface Request {
      userId: string; 
    }
  }
}
