import { Client } from "@notionhq/client";
import {
  AccountModel,
  updateNotionDatabaseIdById,
} from "../repository/account.js";

interface NotionService {
  createAndSaveDatabaseId(
    accessToken: string,
    account: AccountModel,
  ): Promise<string>;
  createPage(accessToken: string, databaseId: string): Promise<string>;
}

async function createAndSaveDatabaseId(
  accessToken: string,
  account: AccountModel,
) {
  const notion = new Client({ auth: accessToken });

  // The ID of the new page created in the user's workspace, duplicated from the provided template.
  // See: https://developers.notion.com/docs/authorization#step-4-notion-responds-with-an-access_token-and-additional-information
  const pageId = account.dataValues.provider_data
    ?.duplicated_template_id as string;
  const { id: databaseId } = await notion.databases.create({
    parent: {
      type: "page_id",
      page_id: pageId,
    },
    // TODO: Define default table properties
    properties: {
      Name: {
        title: {},
      },
      Description: {
        rich_text: {},
      },
    },
    is_inline: true,
  });

  const accountId = account.dataValues.id;
  await updateNotionDatabaseIdById(accountId, databaseId);

  return databaseId;
}

async function createPage(accessToken: string, databaseId: string) {
  const notion = new Client({ auth: accessToken });

  const { id: pageId } = await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    // TODO: get from parameter
    properties: {
      Name: {
        title: [
          {
            text: {
              content: "Tuscan kale",
            },
          },
        ],
      },
      Description: {
        rich_text: [
          {
            text: {
              content: "A dark green leafy vegetable",
            },
          },
        ],
      },
    },
  });

  return pageId;
}

export const notionService: NotionService = {
  createAndSaveDatabaseId,
  createPage,
};
