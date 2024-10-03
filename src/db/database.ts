import { Sequelize } from "sequelize";
import { config } from "../config";

const { host, user, database, password } = config.db;

const createSequelizeInstance = () => {
  const sequelize = new Sequelize(database, user, password, {
    dialect: "postgres",
    host,
  });

  return sequelize;
};

export const initDatabase = async () => {
  const sequelize = createSequelizeInstance();
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return sequelize;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
