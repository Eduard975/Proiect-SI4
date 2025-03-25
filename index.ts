console.log("hihi");

import { sboxEncrypt, sboxDecrypt } from "./consts";
import {
  createBlocks,
  encrypt,
  inverseOrder,
  type Matrix,
  printMatrix,
  shiftRows,
  string_to_bytes,
  substitute,
} from "./utils";

const input: Matrix = [
  0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96, 0xe9, 0x3d, 0x7e, 0x11, 0x73,
  0x93, 0x17, 0x2a,
];

const key: Matrix = [
  0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x15, 0x88, 0x09,
  0xcf, 0x4f, 0x3c,
];

const inputM = inverseOrder(input);
const keyM = inverseOrder(key);

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

const encrypted = encrypt(inputM, keyM); // Assuming encrypt() returns a string
const encodedBytes = encoder.encode(encrypted);

console.log(toHex(encodedBytes)); // Print

const test2: Matrix = [
  0x74, 0x6c, 0xe1, 0x09, 0xc5, 0x1e, 0xdd, 0x3b, 0xdf, 0x93, 0x79, 0xc7, 0x3c,
  0x62, 0xb0, 0xe7,
];

printMatrix(inverseOrder(test2));
console.log();
printMatrix(substitute(inverseOrder(test2), sboxEncrypt));
console.log();
printMatrix(shiftRows(inverseOrder(test2)));

createBlocks(string_to_bytes("aashdashsdhasdh"));
