import ms from "ms";

export const thirtyDaysFromNow = (): Date =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export const fortyFiveMinutesFromNow = (): Date => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 45);
  return now;
};

export const calculateExpirationDate = (
  expiresIn: ms.StringValue = "15m"
): Date => {
  const duration = ms(expiresIn);
  if (duration === undefined)
    throw new Error('Invalid format. Use "15m", "1h", or "2d".');
  return new Date(Date.now() + duration);
};
