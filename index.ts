import { encrypt, type Matrix, printMatrix, transposeMatrix } from "./utils";

const key: Matrix = [
  0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
  0x0,
];

const input: Matrix = [
  0x74, 0x6c, 0xe1, 0x09, 0xc5, 0x1e, 0xdd, 0x3b, 0xdf, 0x93, 0x79, 0xc7, 0x3c,
  0x62, 0xb0, 0xe7,
];

const expectedResult: Matrix = [
  0x5c, 0xc1, 0xe3, 0x36, 0xeb, 0xcf, 0xbe, 0x48, 0x43, 0xc6, 0x32, 0x79, 0x45,
  0x35, 0xab, 0xb6,
]; // Result obtained from https://legacy.cryptool.org/en/cto/aes-step-by-step using the same input and key

console.log("----------------- Initial Data -----------------");
console.log("Input");
printMatrix(input);
console.log();

console.log("Key");
printMatrix(key);
console.log();

console.log("-------- Encrypted Result for our AES-128 --------");
printMatrix(encrypt(transposeMatrix(input), key));
console.log();
console.log("---------- Expected Result for AES-128 -----------");
printMatrix(transposeMatrix(expectedResult));
