import { MagicLink } from "./hooks/magic-link-authentication.hooks";
import Mfa from "./hooks/mfa.hooks";
import PasswordAuth from "./hooks/password-authentication.hooks";

const client = { PasswordAuth, MagicLink, Mfa };

export default client;
