import * as fs from "fs";

const VOLUME = "volume/";

export const Directories = {
    UPLOADS: VOLUME + "uploads/",
    TEMP: VOLUME + "temp/",
};


export function createDirectories(): void {
    Object.values(Directories).forEach((directory) => {
        try {
            if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
        } catch (error) {
            console.error(`Error creating directory: ${directory}`, error);
        }
    });
}
