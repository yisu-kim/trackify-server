import OAuth2Strategy, { VerifyCallback } from "passport-oauth2";
import { config } from "../config.js";

const {
  auth: {
    provider: { notion },
  },
} = config;

const notionStrategyOptions = {
  authorizationURL: notion.authorizationURL,
  tokenURL: notion.tokenUrl,
  clientID: notion.id,
  clientSecret: "", // Not used in passport strategy due to Notion's custom authorization
  callbackURL: notion.redirectUri,
  state: true,
  customHeaders: {
    // Notion API requires a custom Authorization header
    // The client secret is used here
    // See: https://developers.notion.com/docs/authorization#step-3-send-the-code-in-a-post-request-to-the-notion-api
    Authorization:
      "Basic " +
      Buffer.from(`${notion.id}:${notion.secret}`, "utf-8").toString("base64"),
  },
};

interface NotionOAuthParams {
  owner: {
    user: {
      id: string;
      name: string;
    };
  };
  workspace_id: string;
}

export interface NotionUser {
  id: string;
  accessToken: string;
}

function notionVerifyFunction(
  accessToken: string,
  refreshToken: string,
  params: NotionOAuthParams,
  profile: unknown,
  cb: VerifyCallback,
) {
  try {
    const {
      owner: {
        user: { id, name },
      },
      workspace_id,
    } = params;
    // TODO: User.findOrCreate
    const user: NotionUser = { id, accessToken };
    return cb(null, user);
  } catch (error) {
    return cb(error);
  }
}

export const notionStrategy = new OAuth2Strategy(
  notionStrategyOptions,
  notionVerifyFunction,
);
