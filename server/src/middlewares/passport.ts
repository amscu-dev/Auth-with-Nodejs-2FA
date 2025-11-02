import { setupAccessTokenStrategy } from "@/common/strategies/access-token-jwt.strategy";
import { setupMagicLinkTokenStrategy } from "@/common/strategies/magic-link-token-jwt.strategy";
import { setupMfaTokenStrategy } from "@/common/strategies/mfa-token-jwt.strategy";
import { setupRefreshTokenStrategy } from "@/common/strategies/refresh-token-jwt.strategy";
import passport from "passport";

const initializePassport = () => {
  setupAccessTokenStrategy(passport);
  setupRefreshTokenStrategy(passport);
  setupMagicLinkTokenStrategy(passport);
  setupMfaTokenStrategy(passport);
};

initializePassport();
export default passport;
