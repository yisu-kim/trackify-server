import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { enrichWithAccount } from "../middleware/account.js";
import { createDatabase } from "../controller/notion.js";

const router = Router();

router.use(isAuthenticated);

router.post("/databases", enrichWithAccount, createDatabase);

export default router;
