import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.resolve(
  __dirname,
  "../../server/src/common/enums/error-code.enum.ts"
);

const destDir = path.resolve(__dirname, "../types/enums");
const destPath = path.join(destDir, "error-code.enum.ts");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(sourcePath, destPath);

console.log(`✅ Copied error-code.enum.ts to ${destPath}`);
