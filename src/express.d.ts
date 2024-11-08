import { AccountModel } from "./repository/account.ts";

export declare global {
  namespace Express {
    interface Request {
      currentUser: {
        id: number;
        account: AccountModel;
      };
    }
  }
}
