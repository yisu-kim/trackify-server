import { Request, Response } from "express";

import { accountService } from "../service/account.js";
import {
  CreatePageParametersWithoutParent,
  notionService,
} from "../service/notion.js";

export async function createDatabase(req: Request, res: Response) {
  const {
    currentUser: { account },
  } = req;

  try {
    const accessToken = await accountService.getAccessToken(
      account.dataValues.id,
    );
    const databaseId = await notionService.createAndSaveDatabaseId(
      accessToken,
      account,
    );

    return res.status(201).json({ databaseId });
  } catch (error) {
    console.error("Failed to create Notion database: ", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function createPage(req: Request, res: Response) {
  const {
    currentUser: { account },
  } = req;

  // TODO: Update table properties
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({
      message: "Name and description are required",
    });
  }

  try {
    const accessToken = await accountService.getAccessToken(
      account.dataValues.id,
    );

    const databaseId = account.dataValues.provider_data?.database_id;
    if (!databaseId) {
      return res.status(400).json({
        message: "Notion database not initialized.",
      });
    }

    const pageParameters: CreatePageParametersWithoutParent = {
      properties: {
        Name: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        Description: {
          rich_text: [
            {
              text: {
                content: description,
              },
            },
          ],
        },
      },
    };

    const pageId = await notionService.createPage(
      accessToken,
      databaseId,
      pageParameters,
    );
    return res.status(201).json({ pageId });
  } catch (error) {
    console.error("Failed to create Notion page: ", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
