import multer from "multer";
import { Directories } from "./directories";
import path from "path";
import fs from "fs";

// ensure folders exist
[Directories.TEMP, Directories.UPLOADS].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, Directories.TEMP),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    const unique = `${Date.now()}-${safe}`;
    cb(null, unique);
  },
});

export const multerConfig = multer({ storage }); // 👈 exported
