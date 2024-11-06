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
}

async function createAndSaveDatabaseId(
  accessToken: string,
  account: AccountModel,
) {
  const notion = new Client({ auth: accessToken });

  // The ID of the new page created in the user's workspace, duplicated from the provided template.
  // See: https://developers.notion.com/docs/authorization#step-4-notion-responds-with-an-access_token-and-additional-information
  const pageId = account.dataValues.provider_data?.duplicated_template_id;
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

export const notionService: NotionService = {
  createAndSaveDatabaseId,
};
