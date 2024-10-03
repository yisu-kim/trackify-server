import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config";
import { initDatabase } from "./db/database";

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
  // TODO: handle error
  res.status(error.status || 500).json({
    message: "Internal Server Error",
  });
});

initDatabase().then(() => {
  app.listen(config.port, () => {
    console.log(
      `listening on port ... ${config.port} ${new Date().toISOString()}`,
    );
  });
});
