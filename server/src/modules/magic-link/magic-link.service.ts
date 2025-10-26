import { InternalServerException } from "@/common/utils/catch-errors";
import { magicLinkTokenOptions, signJwtToken } from "@/common/utils/jwt";
import apiRequestWithRetry from "@/common/utils/retry-api";
import { generateUniqueCode } from "@/common/utils/uuid";
import { MagicLinkModel } from "@/database/models/magicLinkSession.model";
import { sendEmail } from "@/mailers/mailer";
import { magicLinkEmailTemplate } from "@/mailers/templates/template";

export class MagicLinkService {
  public async generateMagicLink(email: string) {
    const tokenId = generateUniqueCode();
    const magicLinkSession = await MagicLinkModel.create({
      tokenJTI: tokenId,
      userEmail: email,
    });
    const magicToken = signJwtToken(
      {
        jti: tokenId,
        userEmail: email,
        magicLinkSession: magicLinkSession.id,
        type: "magic-link",
      },
      { ...magicLinkTokenOptions, algorithm: "HS256" }
    );
    // * TODO : Modificare hardcodare link
    const magicLink = `http://localhost:8000/api/v1/magic-link/${magicToken}`;

    const isMagicLinkEmailSend = await apiRequestWithRetry(() => {
      return sendEmail({
        to: email,
        ...magicLinkEmailTemplate(magicLink),
      });
    });
    if (!isMagicLinkEmailSend) {
      throw new InternalServerException();
    }
    return isMagicLinkEmailSend;
  }
}
