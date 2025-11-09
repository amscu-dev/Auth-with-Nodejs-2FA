import { AuthenticationResponseJSON } from "@simplewebauthn/browser";

function hasUserHandle(
  cred: AuthenticationResponseJSON
): cred is AuthenticationResponseJSON & { response: { userHandle: string } } {
  return (
    typeof cred.response.userHandle === "string" &&
    cred.response.userHandle.length > 0
  );
}

export { hasUserHandle };
