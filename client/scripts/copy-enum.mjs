import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Copy single enum file ---
const sourceEnumPath = path.resolve(
  __dirname,
  "../../server/src/common/enums/error-code.enum.ts"
);

const destEnumDir = path.resolve(__dirname, "../types/enums");
const destEnumPath = path.join(destEnumDir, "error-code.enum.ts");

if (!fs.existsSync(destEnumDir)) {
  fs.mkdirSync(destEnumDir, { recursive: true });
}

fs.copyFileSync(sourceEnumPath, destEnumPath);
console.log(`✅ Copied error-code.enum.ts to ${destEnumPath}`);

// --- Copy validators folder ---
const sourceValidatorsDir = path.resolve(
  __dirname,
  "../../server/src/validators"
);
const destValidatorsDir = path.resolve(__dirname, "../client/schemas");

if (fs.existsSync(destValidatorsDir)) {
  fs.rmSync(destValidatorsDir, { recursive: true, force: true });
}

fs.mkdirSync(destValidatorsDir, { recursive: true });

const files = fs.readdirSync(sourceValidatorsDir);
files.forEach((file) => {
  const srcFile = path.join(sourceValidatorsDir, file);
  const destFile = path.join(destValidatorsDir, file);
  fs.copyFileSync(srcFile, destFile);
  console.log(`✅ Copied ${file} to ${destFile}`);
});

console.log("✅ All validators copied successfully!");
