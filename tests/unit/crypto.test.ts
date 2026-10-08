import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt, mask } from "@/lib/crypto";

describe("lib/crypto", () => {
  const sampleKey = Buffer.alloc(32, "a").toString("base64");

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = sampleKey;
  });

  it("should encrypt and decrypt correctly (round-trip)", () => {
    const text = "AIzaSyD-Secret-Key-123456789";
    const encrypted = encrypt(text);
    expect(encrypted).not.toBe(text);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it("should fail if ciphertext is tampered with", () => {
    const text = "Secret-Token-123";
    const encrypted = encrypt(text);
    const buf = Buffer.from(encrypted, "base64");
    // Flip a byte in the ciphertext payload
    buf[buf.length - 1] ^= 0xff;
    const tampered = buf.toString("base64");

    expect(() => decrypt(tampered)).toThrow();
  });

  it("should mask strings properly", () => {
    expect(mask("AIzaSyD1234567890xQ2")).toBe("AIza••••••••0xQ2");
    expect(mask("short")).toBe("••••••••");
    expect(mask("")).toBe("");
  });
});
