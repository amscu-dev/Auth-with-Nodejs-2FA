import { CreateEmailResponse } from "resend";

async function apiRequestWithRetry(
  requestFn: () => Promise<CreateEmailResponse>,
  maxRetries = 3,
  initialDelay = 1000 // ms
): Promise<boolean> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      const result = await requestFn();
      if (!result.data || result.error) {
        throw new Error(result.error?.message || "Failed to send email.");
      }
      return true;
    } catch (error) {
      attempt++;
      // Add jitter: ±50% of delay
      const jitter = delay * (Math.random() * 0.5 + 0.75); // 0.75x → 1.25x
      console.warn(
        `Attempt ${attempt} failed. Retrying in ${Math.round(jitter)} ms...`
      );
      if (attempt === maxRetries) {
        console.warn("Max number of attempt reached.");
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, jitter));

      // Exponential backoff
      delay *= 2;
    }
  }
  return true;
  // fallback, theoretically never reached
  // throw new Error("Retry logic exited unexpectedly");
}
export default apiRequestWithRetry;
