import { Sequelize } from "sequelize";
import { config } from "../config";

const { host, user, database, password } = config.db;

export const sequelize = new Sequelize(database, user, password, {
  dialect: "postgres",
  host,
});
