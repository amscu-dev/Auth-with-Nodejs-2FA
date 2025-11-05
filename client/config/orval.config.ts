import path from "path";
import { defineConfig } from "orval";

export default defineConfig({
  "auth-client": {
    input: path.resolve(__dirname, "../../server/src/spec/openapi.yaml"),
    output: {
      target: "../api/client/client.ts",
      mode: "tags",
      override: {
        mutator: {
          path: "./axios.config.ts",
          name: "customAxiosInstance",
        },
      },
    },
  },
  "auth-zod": {
    input: path.resolve(__dirname, "../../server/src/spec/openapi.yaml"),
    output: {
      mode: "tags",
      client: "zod",
      target: "../schemas",
      fileExtension: ".schema.ts",
    },
  },
});
