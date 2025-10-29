const decodeBase64 = (
  token: string,
  format: BufferEncoding = "ascii"
): string => Buffer.from(token, "base64").toString(format);

export default decodeBase64;
