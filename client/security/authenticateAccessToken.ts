import * as jose from "jose";
import { env } from "@/env";
import { importSPKI } from "jose";

export async function validateAccessToken({
  jwt,
}: {
  jwt: string;
}): Promise<boolean> {
  try {
    const publicKey = await importSPKI(
      env.JWT_ACCESS_TOKEN_PUBLIC_KEY,
      "RS256"
    );
    await jose.jwtVerify(jwt, publicKey, {
      algorithms: ["RS256"],
      issuer: env.JWT_TOKEN_ISSUER,
      audience: env.JWT_TOKEN_AUDIENCE,
    });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}
