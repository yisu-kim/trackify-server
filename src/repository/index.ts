import { sequelize } from "../db/database.js";
import { defineUserModel } from "./user.js";
import { defineAccountModel } from "./account.js";

const User = defineUserModel(sequelize);
const Account = defineAccountModel(sequelize);

User.hasMany(Account, { foreignKey: "user_id" });
Account.belongsTo(User, { foreignKey: "user_id" });

export { User, Account };
