import { Sequelize } from "sequelize";

export function setAssociations(sequelize: Sequelize) {
  const { Account, User } = sequelize.models;

  User.hasMany(Account, { foreignKey: "user_id" });
  Account.belongsTo(User, { foreignKey: "user_id" });
}
