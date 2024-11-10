import { sequelize } from "../db/database.js";
import { defineUserModel } from "./user.js";
import { defineAccountModel } from "./account.js";
import { defineVerificationToken } from "./verificationToken.js";

const User = defineUserModel(sequelize);
const Account = defineAccountModel(sequelize);
const VerificationToken = defineVerificationToken(sequelize);

User.hasMany(Account, { foreignKey: "user_id" });
Account.belongsTo(User, { foreignKey: "user_id" });

export { User, Account, VerificationToken };
