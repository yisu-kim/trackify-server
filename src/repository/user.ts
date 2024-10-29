import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";

import { config } from "../config.js";
import { sequelize } from "../db/database.js";
import { Account } from "./account.js";

const {
  db: { schema },
} = config;

interface UserModel
  extends Model<
    InferAttributes<UserModel>,
    InferCreationAttributes<UserModel>
  > {
  id: CreationOptional<number>;
  name: string | null;
  email: string;
}

export const User = sequelize.define<UserModel>(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
  },
  {
    schema,
    freezeTableName: true,
    tableName: "User",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export async function findOrCreateUser(
  userData: InferCreationAttributes<UserModel, { omit: "id" }>,
) {
  const [user, created] = await User.findOrCreate({
    where: { email: userData.email },
    defaults: userData,
  });
  return { user, created };
}

export async function findUserByAccountId(accountId: string) {
  return User.findOne({
    include: [
      {
        model: Account,
        where: { id: accountId },
      },
    ],
  });
}
