import { MagicLink } from "./hooks/magic-link-authentication.hooks";
import Mfa from "./hooks/mfa.hooks";
import OIDC from "./hooks/oidc-authentication.hooks";
import Passkey from "./hooks/passkey-authentication.hooks";
import PasswordAuth from "./hooks/password-authentication.hooks";
import Session from "./hooks/session.hooks";

const client = { PasswordAuth, MagicLink, Mfa, Passkey, OIDC, Session };

export default client;
