// import { encrypt, decrypt, createBlocks } from "./utils";
// import * as crypto from "crypto";

// describe("AES Implementation", () => {
//   const key = Buffer.from("2b7e151628aed2a6abf7158809cf4f3c", "hex");
//   const keyMatrix = createBlocks(Array.from(key))[0];

//   it("should encrypt and decrypt text correctly", () => {
//     const plaintext = "kÁ¾â.@é=~s*";
//     const x = Buffer.from("6bc1bee22e409f96e93d7e117393172a", "hex");

//     // Encrypt using custom AES
//     const encrypted = encrypt(plaintext, keyMatrix);
//     const encryptedBuffer = Buffer.from(encrypted, "binary");

//     // Encrypt using crypto library
//     const cipher = crypto.createCipheriv("aes-128", key, null);
//     let cryptoEncrypted = cipher.update(plaintext, "utf8", "binary");
//     cryptoEncrypted += cipher.final("binary");

//     // Compare encrypted results
//     expect(encryptedBuffer.toString("hex")).toEqual(
//       Buffer.from(cryptoEncrypted, "binary").toString("hex")
//     );

//     // Decrypt using custom AES
//     const decrypted = decrypt(encrypted, keyMatrix);

//     // Decrypt using crypto library
//     const decipher = crypto.createDecipheriv("aes-128", key, null);
//     let cryptoDecrypted = decipher.update(cryptoEncrypted, "binary", "utf8");
//     cryptoDecrypted += decipher.final("utf8");

//     // Compare decrypted results
//     expect(decrypted).toEqual(cryptoDecrypted);
//   });

//   it("should handle multiple blocks and padding", () => {
//     const plaintext =
//       "This is a longer text that requires multiple AES blocks!";

//     const encrypted = encrypt(plaintext, keyMatrix);
//     const decrypted = decrypt(encrypted, keyMatrix);

//     expect(decrypted).toEqual(plaintext);
//   });
// });
