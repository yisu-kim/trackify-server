import { Request, Response } from "express";
import { accountService } from "../service/account.js";
import { notionService } from "../service/notion.js";

export async function createDatabase(req: Request, res: Response) {
  const {
    currentUser: { iv, account },
  } = req;

  const accessToken = await accountService.getAccessToken(
    account.dataValues.id,
    iv,
  );
  const databaseId = await notionService.createAndSaveDatabaseId(
    accessToken,
    account,
  );

  return res.status(200).json({ databaseId });
}
