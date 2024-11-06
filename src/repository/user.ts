import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

import { Account, User } from "./index.js";

interface UserModel
  extends Model<
    InferAttributes<UserModel>,
    InferCreationAttributes<UserModel>
  > {
  id: CreationOptional<number>;
  name: string | null;
  email: string;
}
export function defineUserModel(sequelize: Sequelize) {
  const User = sequelize.define<UserModel>(
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
        unique: true,
        validate: {
          isEmail: true,
        },
      },
    },
    {
      freezeTableName: true,
      tableName: "User",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return User;
}

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

export async function countUsersById(id: number): Promise<number> {
  return User.count({ where: { id } });
}
