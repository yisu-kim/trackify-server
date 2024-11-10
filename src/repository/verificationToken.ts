import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";
import { VerificationToken } from "./index.js";

interface VerificationTokenModel
  extends Model<
    InferAttributes<VerificationTokenModel>,
    InferCreationAttributes<VerificationTokenModel>
  > {
  token: string;
  expires: Date;
  identifier: string;
}

export function defineVerificationToken(sequelize: Sequelize) {
  const VerificationToken = sequelize.define<VerificationTokenModel>(
    "VerificationToken",
    {
      token: {
        type: DataTypes.STRING(255),
        primaryKey: true,
      },
      expires: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      identifier: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      tableName: "VerificationToken",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return VerificationToken;
}

export async function createVerificationToken(
  tokenData: InferCreationAttributes<VerificationTokenModel>,
) {
  return await VerificationToken.create(tokenData);
}

export async function useVerificationToken({
  identifier,
  token,
}: InferAttributes<VerificationTokenModel>) {
  const foundToken = await VerificationToken.findOne({
    where: { token, identifier },
  });
  if (!foundToken) {
    throw new Error("Token not found or invalid");
  }

  await VerificationToken.destroy({ where: { token, identifier } });
}
