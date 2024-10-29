import { Sequelize } from "sequelize";

export function setAssociations(sequelize: Sequelize) {
  const { Account, User } = sequelize.models;

  if (!Account || !User) {
    throw new Error("Required models are not initialized");
  }

  User.hasMany(Account, { foreignKey: "user_id" });
  Account.belongsTo(User, { foreignKey: "user_id" });
}
