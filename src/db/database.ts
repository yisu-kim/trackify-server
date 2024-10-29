import { Sequelize } from "sequelize";
import { config } from "../config.js";

const {
  db: { host, user, database, password },
} = config;

export const sequelize = new Sequelize(database, user, password, {
  dialect: "postgres",
  host,
});

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return sequelize;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
