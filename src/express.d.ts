export declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        iv: string;
      };
    }
  }
}
