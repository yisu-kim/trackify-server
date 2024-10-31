import { Sequelize } from "sequelize";
import { config } from "../config.js";

const {
  db: { host, user, database, password, schema },
} = config;

export const sequelize = new Sequelize(database, user, password, {
  dialect: "postgres",
  host,
  schema,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });
