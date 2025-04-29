import crypto from "crypto";
import {
  bytesToString,
  type Matrix,
  stringToBytes,
  transposeMatrix,
} from "./utils/utils";
import { decrypt } from "./utils/utils-decrypt";
import { encrypt } from "./utils/utils-encrypt";

const key1: Matrix = Array.from(Buffer.alloc(16, 0)) as Matrix;
const key2: Matrix = Array.from(
  Buffer.from([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10, 0x11, 0x12,
    0x13, 0x14, 0x15, 0x16,
  ])
) as Matrix;

const input: Matrix = Array.from(
  Buffer.from([
    0x74, 0x6c, 0xe1, 0x09, 0xc5, 0x1e, 0xdd, 0x3b, 0xdf, 0x93, 0x79, 0xc7,
    0x3c, 0x62, 0xb0, 0xe7,
  ])
) as Matrix;

function encryptWithCrypto(input: Buffer, key: Buffer): Buffer {
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(false); // Disable padding for raw block mode
  return Buffer.concat([cipher.update(input), cipher.final()]);
}

function decryptWithCrypto(encrypted: Buffer, key: Buffer): Buffer {
  const decipher = crypto.createDecipheriv("aes-128-ecb", key, null);
  decipher.setAutoPadding(false); // Disable padding for raw block mode
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

describe("AES Encryption", () => {
  test("Encrypt with Key1 (All 0)", () => {
    const expected = encryptWithCrypto(Buffer.from(input), Buffer.from(key1));
    const result = encrypt(transposeMatrix(input), transposeMatrix(key1));
    console.log("Expected:", expected);
    console.log("Result:", Buffer.from(result));
    expect(Buffer.from(result)).toEqual(expected);
  });

  test("Encrypt with Key2 (Hex 1 to 16)", () => {
    const expected = encryptWithCrypto(Buffer.from(input), Buffer.from(key2));
    const result = encrypt(transposeMatrix(input), transposeMatrix(key2));

    console.log("Expected:", expected);
    console.log("Result:", Buffer.from(result));

    expect(Buffer.from(result)).toEqual(expected);
  });
});

describe("AES Decryption", () => {
  test("Decrypt with Key1 (All 0)", () => {
    const encrypted = encryptWithCrypto(Buffer.from(input), Buffer.from(key1));
    const decrypted = decryptWithCrypto(encrypted, Buffer.from(key1));
    console.log("Encrypted:", encrypted);
    console.log("Decrypted:", decrypted);
    expect(Array.from(decrypted) as Matrix).toEqual(input);
  });

  test("Decrypt with Key2 (Hex 1 to 16)", () => {
    const encrypted = encryptWithCrypto(Buffer.from(input), Buffer.from(key2));
    const decrypted = decryptWithCrypto(encrypted, Buffer.from(key2));
    console.log("Encrypted:", encrypted);
    console.log("Decrypted:", decrypted);
    expect(Array.from(decrypted) as Matrix).toEqual(input);
  });
});

describe("AES Encrypt/Decrypt with String Input", () => {
  test("Encrypt/Decrypt 'abcd'", () => {
    const temp: number[] = stringToBytes("abcd");
    const mat: Matrix = Array(16).fill(0) as Matrix;
    for (let i = 0; i < 16; i++) {
      mat[i] = temp[i];
    }

    const encrypted = encrypt(mat, transposeMatrix(key2));
    console.log("Encrypted:", encrypted);
    const decrypted = decrypt(
      transposeMatrix(encrypted),
      transposeMatrix(key2)
    );
    console.log("Decrypted:", decrypted);

    expect(bytesToString(decrypted)).toBe("abcd");
    expect(decrypted).toEqual(mat);
  });
});
