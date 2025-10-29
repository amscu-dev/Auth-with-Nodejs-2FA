import { PasskeyController } from "./passkey.controller";
import PasskeyService from "./passkey.service";

const passkeyService = new PasskeyService();
const passkeyController = new PasskeyController(passkeyService);
export { passkeyService, passkeyController };
