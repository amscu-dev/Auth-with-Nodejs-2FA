import { config } from "@/config/app.config";
import jose from "jose";

export interface GoogleIDTokenPayload extends jose.JWTPayload {
  aud: string; // client ID
  exp: number; // expiry
  iat: number; // issued at
  iss: "https://accounts.google.com" | "accounts.google.com";
  sub: string; // unique user ID
  at_hash?: string;
  azp?: string;
  email?: string;
  email_verified?: boolean;
  family_name?: string;
  given_name?: string;
  hd?: string;
  locale?: string;
  name?: string;
  nonce?: string;
  picture?: string;
  profile?: string;
}

export const JWKS_GOOGLE = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export async function verifyOAuthIDToken<T>({
  jwt,
  audience,
  issuer,
  jwks,
}: {
  jwt: string;
  audience: string;
  issuer: string | string[];
  jwks: typeof JWKS_GOOGLE;
}): Promise<{
  payload: T;
  protectedHeader: jose.JWTHeaderParameters;
}> {
  const { payload, protectedHeader } = await jose.jwtVerify(jwt, jwks, {
    issuer,
    audience,
  });

  return { payload: payload as T, protectedHeader };
}

export function getGoogleAuthorizationURL({
  state,
  codeChallenge,
}: {
  state: string;
  codeChallenge: string;
}): string {
  const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

  const queryParams = new URLSearchParams({
    access_type: "offline",
    response_type: "code",
    client_id: config.GOOGLE_OAUTH_CLIENT_ID,
    scope: "openid profile email",
    prompt: "consent",
    redirect_uri: config.GOOGLE_OAUTH_REDIRECT_URI,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${AUTHORIZATION_ENDPOINT}?${queryParams.toString()}`;
}

export function getGoogleTokenEndpointURL({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}) {
  const TOKEN_ENDPOINT_BASE_URL = "https://oauth2.googleapis.com/token";
  const queryParams = new URLSearchParams({
    code: code,
    code_verifier: codeVerifier,
    client_id: config.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: config.GOOGLE_OAUTH_SECRET_KEY,
    redirect_uri: config.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  return { TOKEN_ENDPOINT_BASE_URL, queryParams };
}
