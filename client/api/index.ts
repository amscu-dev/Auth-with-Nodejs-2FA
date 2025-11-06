import { MagicLink } from "./hooks/magic-link-authentication.hooks";
import Mfa from "./hooks/mfa.hooks";
import Passkey from "./hooks/passkey-authentication.hooks";
import PasswordAuth from "./hooks/password-authentication.hooks";

const client = { PasswordAuth, MagicLink, Mfa, Passkey };

export default client;
