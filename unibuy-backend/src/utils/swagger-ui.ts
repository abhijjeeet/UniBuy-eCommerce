import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";

const router = Router();

// Define the path to the swagger JSON file in the consuming microservice's root `src` folder
const swaggerFilePath = path.resolve(process.cwd(), "tsoa", "swagger.json");

// Check if the file exists, and create it with a blank object if it doesn't
if (!fs.existsSync(swaggerFilePath)) {
    fs.mkdirSync(path.dirname(swaggerFilePath), { recursive: true });
    fs.writeFileSync(swaggerFilePath, JSON.stringify({}, null, 2), { encoding: "utf-8" });
}

// Load the Swagger document
const swaggerDocument = require(swaggerFilePath); // eslint-disable-line @typescript-eslint/no-require-imports

// Set up the Swagger UI router
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
        validatorUrl: null, // Disable the validator URL
        docExpansion: 'none' // Set the default expansion mode
    },
    customSiteTitle: 'UniBuy API Documentation', // Specify a custom title for your documentation
    customCss: '.swagger-ui .topbar { display: none }', // Add custom CSS if needed
    // customfavIcon: '/favicon.ico' // Specify a custom favicon
}));

export const swaggerUiRouter = router;
