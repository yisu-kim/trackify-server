import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import expressSession from "express-session";
import passport from "passport";
import { config } from "./config.js";
import { sequelize } from "./db/database.js";
import { checkCsrf } from "./middleware/auth.js";
import authRouter from "./router/auth.js";
import notionRouter from "./router/notion.js";

const {
  client,
  port,
  auth: { session: sessionConfig },
  cookie: cookieConfig,
} = config;

const app = express();

const corsOptions = {
  origin: client.origin,
  credentials: true,
};

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("combined"));

app.use(
  expressSession({
    name: sessionConfig.name,
    secret: sessionConfig.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      ...cookieConfig,
      maxAge: sessionConfig.maxAge,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRouter);
app.use(checkCsrf);
app.use("/notion", notionRouter);

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

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`listening on port ... ${port} ${new Date().toISOString()}`);
  });
});
