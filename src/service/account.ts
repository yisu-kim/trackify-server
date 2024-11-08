import { decryptAccountAccessToken } from "../utils/auth.js";
import { countAccountsById, findAccountById } from "../repository/account.js";

interface AccountService {
  getAccessToken(id: number): Promise<string>;
  isExists(id: number): Promise<boolean>;
}

async function getAccessToken(id: number) {
  const account = await findAccountById(id, {
    attributes: ["provider_account_id", "access_token"],
  });
  if (!account) {
    throw new Error(`Account not found for id: ${id}`);
  }

  const providerAccountId = account.dataValues.provider_account_id;
  const encryptedAccessToken = account.dataValues.access_token;
  return await decryptAccountAccessToken(
    providerAccountId,
    encryptedAccessToken,
  );
}

async function isExists(id: number): Promise<boolean> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid account ID");
  }
  try {
    const count = await countAccountsById(id);
    return count > 0;
  } catch (error) {
    console.error("Account Existence Error:", error);
    throw new Error("Failed to check account existence");
  }
}

export const accountService: AccountService = {
  getAccessToken,
  isExists,
};
