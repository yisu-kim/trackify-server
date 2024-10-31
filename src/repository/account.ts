import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

import { Account } from "./index.js";

interface AccountModel
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
        type: DataTypes.JSON,
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

export async function findAccountById(id: number) {
  return Account.findByPk(id);
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
