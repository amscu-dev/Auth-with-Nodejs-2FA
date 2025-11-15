import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const yamlPath = path.resolve(__dirname, "../../server/src/spec/openapi.yaml");

execSync(`npx @redocly/cli build-docs "${yamlPath}" -o docs/index.html`, {
  stdio: "inherit",
});
