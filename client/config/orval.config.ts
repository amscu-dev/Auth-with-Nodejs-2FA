import path from "path";
import { defineConfig } from "orval";

function formatTagToCamelCase(tag: string) {
  if (!tag) return "";

  const withoutFirstChar = tag.slice(1);

  return withoutFirstChar
    .split(" ")
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toLowerCase() + word.slice(1);
      } else {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
    })
    .join("");
}

export default defineConfig({
  "auth-client": {
    input: path.resolve(__dirname, "../../server/src/spec/openapi.yaml"),
    output: {
      target: "../api/client.ts",
      // schemas: "../types/model.ts",
      mode: "tags-split",
      override: {
        mutator: {
          path: "../api/axios-client.ts",
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
