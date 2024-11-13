import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { enrichWithAccount } from "../middleware/account.js";
import { createDatabase, createPage } from "../controller/notion.js";

const router = Router();

router.use(isAuthenticated, enrichWithAccount);

router.post("/databases", createDatabase);
router.post("/pages", createPage);

export default router;
