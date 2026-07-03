import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("CONNECTOR_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("CONNECTOR_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export function encryptCredentials(obj: object): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(obj);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- decrypted shape varies per connector
/** WARNING: Never log the return value — contains plaintext credentials. */
export function decryptCredentials(ciphertext: string): Record<string, any> {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, "base64");
  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted credentials payload");
  }
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as Record<string, any>;
}
