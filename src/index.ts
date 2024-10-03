import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config";
import { sequelize } from "./db/database";

const app = express();

const corsOptions = {
  origin: config.cors.allowedOrigin,
};

app.use(express.json());
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("combined"));

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello World!");
});

app.use((req: express.Request, res: express.Response) => {
  res.sendStatus(404);
});

interface HttpError extends Error {
  status?: number;
}

app.use((error: HttpError, req: express.Request, res: express.Response) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message,
  });
});

sequelize
  .sync()
  .then(() => {
    console.log("Connection has been established successfully.");
    app.listen(config.port, () => {
      console.log(
        `listening on port ... ${config.port} ${new Date().toISOString()}`,
      );
    });
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });
