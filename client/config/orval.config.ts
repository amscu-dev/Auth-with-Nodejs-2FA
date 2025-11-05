import path from "path";
import { defineConfig } from "orval";
import { env } from "@/env";

export default defineConfig({
  "petstore-file": {
    input: path.resolve(__dirname, "../../server/src/spec/openapi.yaml"),
    output: {
      target: "../api/client.ts",
      baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    },
  },
});
