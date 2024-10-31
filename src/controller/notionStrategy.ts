import OAuth2Strategy, { VerifyCallback } from "passport-oauth2";
import { config } from "../config.js";
import { findOrCreateUser } from "../repository/user.js";
import { findOrCreateAccount } from "../repository/account.js";
import { User } from "./auth.js";

const {
  auth: {
    provider: { notion: notionConfig },
  },
} = config;

const NOTION_PROVIDER = "notion";

const notionStrategyOptions = {
  authorizationURL: notionConfig.authorizationURL,
  tokenURL: notionConfig.tokenUrl,
  clientID: notionConfig.id,
  clientSecret: "", // Not used in passport strategy due to Notion's custom authorization
  callbackURL: notionConfig.redirectUri,
  state: true,
  customHeaders: {
    // Notion API requires a custom Authorization header
    // The client secret is used here
    // See: https://developers.notion.com/docs/authorization#step-3-send-the-code-in-a-post-request-to-the-notion-api
    Authorization:
      "Basic " +
      Buffer.from(
        `${notionConfig.id}:${notionConfig.secret}`,
        "utf-8",
      ).toString("base64"),
  },
};

interface NotionOAuthParams {
  owner: {
    user: {
      id: string;
      name: string;
      person: { email: string };
    };
  };
  workspace_id: string;
}

async function notionVerifyFunction(
  accessToken: string,
  refreshToken: string,
  params: NotionOAuthParams,
  profile: unknown,
  cb: VerifyCallback,
) {
  try {
    const {
      owner: { user: providerAccount },
      workspace_id,
    } = params;

    const { user } = await findOrCreateUser({
      name: providerAccount.name,
      email: providerAccount.person.email,
    });

    const { account } = await findOrCreateAccount({
      user_id: user.id,
      provider_name: NOTION_PROVIDER,
      provider_account_id: providerAccount.id,
      provider_data: {
        workspace_id,
      },
    });

    const userData: User = {
      accountId: account.id,
      providerAccountId: providerAccount.id,
      accessToken,
    };
    return cb(null, userData);
  } catch (error) {
    console.error("Notion Verification Error", error);
    return cb(error);
  }
}

export const notionStrategy = new OAuth2Strategy(
  notionStrategyOptions,
  notionVerifyFunction,
);
