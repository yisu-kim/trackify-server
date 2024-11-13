import {
  Attributes,
  CreationOptional,
  DataTypes,
  FindOptions,
  InferAttributes,
  InferCreationAttributes,
  Model,
  QueryTypes,
  Sequelize,
} from "sequelize";

import { config } from "../config.js";
import { sequelize } from "../db/database.js";
import { Account } from "./index.js";

const { db: dbConfig } = config;

export interface AccountModel
  extends Model<
    InferAttributes<AccountModel>,
    InferCreationAttributes<AccountModel>
  > {
  id: CreationOptional<number>;
  user_id: number;
  provider_name: string;
  provider_account_id: string;
  provider_data: Record<string, unknown> | null;
  access_token: string | null;
}

export function defineAccountModel(sequelize: Sequelize) {
  const Account = sequelize.define<AccountModel>(
    "Account",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
      },
      provider_account_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      provider_name: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      provider_data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      access_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      tableName: "Account",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["provider_account_id", "provider_name"],
        },
      ],
    },
  );
  return Account;
}

export async function findOrCreateAccount(
  accountData: InferCreationAttributes<
    AccountModel,
    { omit: "id" | "access_token" }
  >,
) {
  const [account, created] = await Account.findOrCreate({
    where: {
      provider_name: accountData.provider_name,
      provider_account_id: accountData.provider_account_id,
    },
    defaults: accountData,
  });
  return { account, created };
}

export async function findAccountById(
  id: number,
  options?: Omit<FindOptions<Attributes<AccountModel>>, "where">,
) {
  return Account.findByPk(id, options);
}

export async function findAccountByUserId(userId: number) {
  return Account.findOne({ where: { user_id: userId } });
}

export async function updateAccountById(
  id: number,
  updateData: Partial<
    InferCreationAttributes<
      AccountModel,
      { omit: "id" | "user_id" | "provider_name" | "provider_account_id" }
    >
  >,
) {
  const [affectedCount, affectedRows] = await Account.update(updateData, {
    where: { id },
    returning: true,
  });

  if (affectedCount === 0) {
    throw new Error(`Account with id ${id} not found`);
  }

  return affectedRows[0];
}

export async function countAccountsById(id: number): Promise<number> {
  return Account.count({ where: { id } });
}

export async function updateNotionDatabaseIdById(
  id: number,
  databaseId: string,
) {
  return sequelize.query(
    `
    UPDATE "${dbConfig.schema}"."Account"
    SET provider_data = jsonb_set(provider_data, '{database_id}', to_jsonb(:databaseId::text))
    WHERE id = :id
    `,
    {
      replacements: { databaseId, id },
      type: QueryTypes.UPDATE,
    },
  );
}
