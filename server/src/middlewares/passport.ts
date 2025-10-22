import { setupJwtStrategy } from "@/common/strategies/jwt.strategy";
import { setupMfaStrategy } from "@/common/strategies/mfa-token.strategy";
import passport from "passport";

const initializePassport = () => {
  setupJwtStrategy(passport);
  setupMfaStrategy(passport);
};

initializePassport();
export default passport;
