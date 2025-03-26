import {
  bytesToString,
  type Matrix,
  printMatrix,
  stringToBytes,
  transposeMatrix,
} from "./utils/utils";
import { decrypt } from "./utils/utils-decrypt";
import { encrypt } from "./utils/utils-encrypt";

const key1: Matrix = [
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00,
];
const key2: Matrix = [
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10, 0x11, 0x12, 0x13,
  0x14, 0x15, 0x16,
];

const input: Matrix = [
  0x74, 0x6c, 0xe1, 0x09, 0xc5, 0x1e, 0xdd, 0x3b, 0xdf, 0x93, 0x79, 0xc7, 0x3c,
  0x62, 0xb0, 0xe7,
];

// Expected Results were obtained from
// https://legacy.cryptool.org/en/cto/aes-step-by-step
// using the same input and keys
const expectedResult1_All0Key: Matrix = [
  0x5c, 0xc1, 0xe3, 0x36, 0xeb, 0xcf, 0xbe, 0x48, 0x43, 0xc6, 0x32, 0x79, 0x45,
  0x35, 0xab, 0xb6,
];

const expectedResult_Key1To16: Matrix = [
  0x94, 0x66, 0x3f, 0xec, 0x42, 0xef, 0x7c, 0x56, 0x9f, 0x64, 0x31, 0x32, 0xbb,
  0x80, 0x69, 0x06,
];

console.log("----------------- Initial Data -----------------");
console.log("Input");
printMatrix(input);
console.log();

console.log("Key1: All 0");
printMatrix(key1);
console.log();

console.log("Key2: Hex 1 to 16");
printMatrix(key2);
console.log();

console.log("-------- Encrypted Results for our AES-128 --------");
console.log("--- Key 1:");
let res1 = encrypt(transposeMatrix(input), transposeMatrix(key1));

printMatrix(res1);
console.log();

console.log("--- Key 2:");
let res2 = encrypt(transposeMatrix(input), transposeMatrix(key2));
printMatrix(res2);
console.log();

console.log("---------- Expected Result for AES-128 -----------");
console.log("--- Key 1:");
printMatrix(transposeMatrix(expectedResult1_All0Key));
console.log();

console.log("--- Key 2:");
printMatrix(transposeMatrix(expectedResult_Key1To16));
console.log();

console.log("---------- Decrypt test for our AES-128 -----------");
console.log("--- Key 1:");
res1 = transposeMatrix(decrypt(res1, transposeMatrix(key1)));
printMatrix(res1);
console.log();

console.log("--- Key 2:");
res2 = transposeMatrix(decrypt(res2, transposeMatrix(key2)));
printMatrix(res2);
console.log();

console.log("---------- Encrypt/Decrypt test with string input -----------");
const temp: number[] = stringToBytes("abcd");
const mat: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
for (let i = 0; i < 16; i++) {
  mat[i] = temp[i];
}

console.log("---Initial\nabcd");
printMatrix(mat);
console.log();
console.log("---Encrypted");
let res3 = encrypt(transposeMatrix(mat), transposeMatrix(key1));
printMatrix(res3);

console.log();
console.log("---Decrypted");
res3 = transposeMatrix(decrypt(res3, transposeMatrix(key1)));
console.log(bytesToString(res3));
printMatrix(res3);
console.log("\n");
console.log("* Key used was Key1 *");
