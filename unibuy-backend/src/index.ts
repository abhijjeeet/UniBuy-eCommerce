import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import path from "path";
import prisma from "../prisma/prisma";
import { RegisterRoutes } from "../tsoa/routes";
import { swaggerUiRouter } from "./utils/swagger-ui";
import { errorHandler } from "./utils/errorHandler";
import { createDirectories } from "./utils/directories";
import logger from "./utils/logger";
import { appConfig } from "../config/app.config";
import { adminConfig } from "../config/admin.config";
import { multerConfig } from "./utils/multer";

// --- Initialize App ---
const app = express();
createDirectories();

// --- Middleware ---
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/volume/uploads", express.static(path.join(process.cwd(), "volume/uploads")));


const router = express.Router();
RegisterRoutes(router, { multer: multerConfig });
// RegisterRoutes(router);
app.use(router);

app.use("/", swaggerUiRouter);

app.use(errorHandler);

app.listen(appConfig.port, async () => {
  const { email, password } = adminConfig;
  const existingAdmin = await prisma.user.findFirst({
    where: { email, role: "ADMIN" },
  });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: "Administrator",
        email,
        password: hashed,
        isVerified: true,
        role: "ADMIN",
      },
    });
    logger.info("Admin user created successfully ✅");
  } else {
    logger.info("Admin user already exists");
  }

  logger.info(
    `🚀 UniBuy API running at http://${appConfig.host}:${appConfig.port}/`
  );
});
