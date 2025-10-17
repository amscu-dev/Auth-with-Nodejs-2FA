const decodeBase64 = (token: string): string =>
  Buffer.from(token, "base64").toString("ascii");

export default decodeBase64;
