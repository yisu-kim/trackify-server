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
  access_token: string;
  owner: {
    type: string;
    user: {
      id: string;
      name: string;
      type: string;
      object: string;
      person: { email: string };
      avatar_url: string | null;
    };
  };
  bot_id: string;
  request_id: string;
  token_type: string;
  workspace_id: string;
  workspace_icon: string | null;
  workspace_name: string;
  duplicated_template_id: string;
}

async function notionVerifyFunction(
  accessToken: string,
  refreshToken: string,
  params: NotionOAuthParams,
  profile: unknown,
  cb: VerifyCallback,
) {
  try {
    const { access_token, ...provider_data } = params;

    const {
      owner: { user: providerAccount },
    } = provider_data;

    const { user } = await findOrCreateUser({
      name: providerAccount.name,
      email: providerAccount.person.email,
    });

    const { account } = await findOrCreateAccount({
      user_id: user.id,
      provider_name: NOTION_PROVIDER,
      provider_account_id: providerAccount.id,
      provider_data,
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
