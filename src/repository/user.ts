import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

import { User } from "./index.js";

interface UserModel
  extends Model<
    InferAttributes<UserModel>,
    InferCreationAttributes<UserModel>
  > {
  id: CreationOptional<number>;
  name: string | null;
  email: string;
  email_verified?: Date;
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
      email_verified: {
        type: DataTypes.DATE,
        allowNull: true,
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

export async function findUserByEmail(email: string) {
  return User.findOne({ where: { email } });
}

export async function countUsersById(id: number): Promise<number> {
  return User.count({ where: { id } });
}
