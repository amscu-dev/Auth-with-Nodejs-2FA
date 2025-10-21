import { config } from "@/config/app.config";
import { resend } from "./resendClient";

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};
const mailer_sender =
  config.NODE_ENV === "development"
    ? "onboarding@resend.dev"
    : `<${config.MAILER_SENDER}>`;

export const sendEmail = async ({
  subject,
  text,
  html,
  to,
  from = mailer_sender,
}: Params) =>
  await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    text,
    subject,
    html,
  });
