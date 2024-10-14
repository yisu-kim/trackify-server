import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import expressSession from "express-session";
import passport from "passport";
import { config } from "./config.js";
import { checkCsrf } from "./middleware/auth.js";
import authRouter from "./router/auth.js";
import { initDatabase } from "./db/database.js";

const {
  client,
  port,
  auth: { session },
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
    name: session.name,
    secret: session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Only send the cookie over HTTPS.
      // Set to true in production for security, false in development for easier testing.
      secure: process.env.NODE_ENV === "production" ? true : false,
      // Configure cookie sending policy for CORS requests.
      // In production, set to 'none' to allow sending cookies in cross-site requests.
      // In development, set to false to send cookies in all contexts.
      sameSite: process.env.NODE_ENV === "production" ? "none" : false,
      maxAge: session.maxAge,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use(checkCsrf);
app.use("/auth", authRouter);

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
  app.listen(port, () => {
    console.log(`listening on port ... ${port} ${new Date().toISOString()}`);
  });
});
