import { decryptAccountAccessToken } from "../utils/auth.js";
import { countAccountsById, findAccountById } from "../repository/account.js";

interface AccountService {
  getAccessToken(account: number, iv: string): Promise<string>;
  isExists(id: number): Promise<boolean>;
}

async function getAccessToken(accountId: number, iv: string) {
  const account = await findAccountById(accountId, {
    attributes: ["provider_account_id", "access_token"],
  });
  const providerAccountId = account?.dataValues.provider_account_id;
  const encryptedAccessToken = account?.dataValues.access_token;
  return await decryptAccountAccessToken(
    providerAccountId,
    iv,
    encryptedAccessToken,
  );
}

async function isExists(id: number): Promise<boolean> {
  const count = await countAccountsById(id);
  return count > 0;
}

export const accountService: AccountService = {
  getAccessToken,
  isExists,
};
