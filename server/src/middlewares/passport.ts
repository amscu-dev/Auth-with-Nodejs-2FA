import { setupJwtStrategy } from "@/common/strategies/jwt.strategy";
import { setupMagicLinkStrategy } from "@/common/strategies/magic-link.strategy";
import { setupMfaStrategy } from "@/common/strategies/mfa-token.strategy";
import passport from "passport";

const initializePassport = () => {
  setupJwtStrategy(passport);
  setupMfaStrategy(passport);
  setupMagicLinkStrategy(passport);
};

initializePassport();
export default passport;
