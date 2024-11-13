import { AccountModel } from "./repository/account.ts";

export declare global {
  namespace Express {
    interface Request {
      currentUser: {
        userId: number;
        accountId: number;
        account: AccountModel;
      };
    }
  }
}
