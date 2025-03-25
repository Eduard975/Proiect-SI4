import { sboxDecrypt, sboxEncrypt } from "./consts";

export function string_to_bytes(text: string): number[] {
  const result: number[] = [];

  for (const element of text) {
    result.push(element.charCodeAt(0));
  }

  return result;
}

export type Matrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export function createBlocks(bytes: number[]): Matrix[] {
  const result: Matrix[] = [];
  const x = bytes.length;

  for (let i = 0; i < x; i += 16) {
    const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const slice = bytes.slice(i, i + 16);
    for (let j = 0; j < 16; j++) {
      if (j < slice.length) arr[j] = slice[j];
      else arr[j] = 16 - slice.length;
    }
    result.push(inverseOrder(arr));
  }

  return result;
}

export function cuc(bytes: number[]): Matrix[] {
  const result: Matrix[] = [];
  const x = bytes.length;

  for (let i = 0; i < x; i += 16) {
    const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const slice = bytes.slice(i, i + 16);
    for (let j = 0; j < 16; j++) {
      if (j < slice.length) arr[j] = slice[j];
      else arr[j] = 16 - slice.length;
    }
    result.push(arr);
  }

  return result;
}

export function inverseOrder(matrix: Matrix): Matrix {
  const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      arr[4 * j + i] = matrix[4 * i + j];
    }
  }
  return arr;
}

export function printMatrix(matrix: Matrix) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      process.stdout.write(`${matrix[4 * i + j].toString(16)} `);
    }
    process.stdout.write("\n");
  }
}

export function substitute(
  matrix: Matrix,
  sbox: number[] = sboxEncrypt
): Matrix {
  const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 16; i++) {
    arr[i] = sbox[matrix[i]];
  }
  return arr;
}

export function shiftRows(matrix: Matrix): Matrix {
  const arr: Matrix = [
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[3],

    matrix[5],
    matrix[6],
    matrix[7],
    matrix[4],

    matrix[10],
    matrix[11],
    matrix[8],
    matrix[9],

    matrix[15],
    matrix[12],
    matrix[13],
    matrix[14],
  ];

  return arr;
}
export type Word = [number, number, number, number];

export function rotWord(x: Word): Word {
  return [x[3], x[0], x[1], x[2]];
}

export function substituteWordEncrypt(x: Word): Word {
  return [
    sboxEncrypt[x[0]],
    sboxEncrypt[x[1]],
    sboxEncrypt[x[2]],
    sboxEncrypt[x[3]],
  ];
}

const Rcon: number[] = [
  0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36,
];

export function rconWord(x: Word, round: number): Word {
  return [x[0] ^ Rcon[round], x[1], x[2], x[3]];
}

export function bytes_to_string(bytes: number[]): string {
  return bytes.map((b) => String.fromCharCode(b)).join("");
}

function gmul2(a: number): number {
  const result = (a << 1) & 0xff;
  return a & 0x80 ? result ^ 0x1b : result;
}

function gmul3(a: number): number {
  return gmul2(a) ^ a;
}

export function mixColumns(matrix: Matrix): Matrix {
  const newMatrix: Matrix = [...matrix];
  for (let i = 0; i < 4; i++) {
    const s0 = matrix[i];
    const s1 = matrix[i + 4];
    const s2 = matrix[i + 8];
    const s3 = matrix[i + 12];

    newMatrix[i] = gmul2(s0) ^ gmul3(s1) ^ s2 ^ s3;
    newMatrix[i + 4] = s0 ^ gmul2(s1) ^ gmul3(s2) ^ s3;
    newMatrix[i + 8] = s0 ^ s1 ^ gmul2(s2) ^ gmul3(s3);
    newMatrix[i + 12] = gmul3(s0) ^ s1 ^ s2 ^ gmul2(s3);
  }
  return newMatrix;
}

function multiply(a: number, b: number): number {
  let product = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) product ^= a;
    const carry = a & 0x80;
    a = (a << 1) & 0xff;
    if (carry) a ^= 0x1b;
    b >>= 1;
  }
  return product;
}

export function inverseMixColumns(matrix: Matrix): Matrix {
  const newMatrix: Matrix = [...matrix];
  for (let i = 0; i < 4; i++) {
    const s0 = matrix[i];
    const s1 = matrix[i + 4];
    const s2 = matrix[i + 8];
    const s3 = matrix[i + 12];

    newMatrix[i] =
      multiply(0x0e, s0) ^
      multiply(0x0b, s1) ^
      multiply(0x0d, s2) ^
      multiply(0x09, s3);
    newMatrix[i + 4] =
      multiply(0x09, s0) ^
      multiply(0x0e, s1) ^
      multiply(0x0b, s2) ^
      multiply(0x0d, s3);
    newMatrix[i + 8] =
      multiply(0x0d, s0) ^
      multiply(0x09, s1) ^
      multiply(0x0e, s2) ^
      multiply(0x0b, s3);
    newMatrix[i + 12] =
      multiply(0x0b, s0) ^
      multiply(0x0d, s1) ^
      multiply(0x09, s2) ^
      multiply(0x0e, s3);
  }
  return newMatrix;
}

export function invShiftRows(matrix: Matrix): Matrix {
  return [
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[7],
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[10],
    matrix[11],
    matrix[8],
    matrix[9],
    matrix[13],
    matrix[14],
    matrix[15],
    matrix[12],
  ] as Matrix;
}

export function addRoundKey(state: Matrix, roundKey: Matrix): Matrix {
  const newState: Matrix = [...state];
  for (let i = 0; i < 16; i++) {
    newState[i] ^= roundKey[i];
  }
  return newState;
}

export function expandKey(key: Matrix): Matrix[] {
  const words: Word[] = [];
  for (let i = 0; i < 16; i += 4) {
    words.push([key[i], key[i + 1], key[i + 2], key[i + 3]]);
  }

  for (let i = 4; i < 44; i++) {
    let temp: Word = [...words[i - 1]];
    if (i % 4 === 0) {
      temp = substituteWordEncrypt(rotWord(temp));
      temp[0] ^= Rcon[i / 4];
    }
    const newWord: Word = [
      temp[0] ^ words[i - 4][0],
      temp[1] ^ words[i - 4][1],
      temp[2] ^ words[i - 4][2],
      temp[3] ^ words[i - 4][3],
    ];
    words.push(newWord);
  }

  const roundKeys: Matrix[] = [];
  for (let i = 0; i < 11; i++) {
    const roundKey: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let j = 0; j < 4; j++) {
      const word = words[i * 4 + j];
      roundKey[j * 4] = word[0];
      roundKey[j * 4 + 1] = word[1];
      roundKey[j * 4 + 2] = word[2];
      roundKey[j * 4 + 3] = word[3];
    }
    roundKeys.push(roundKey as Matrix);
  }
  return roundKeys;
}

export function encrypt(plaintext: string, key: Matrix): string {
  const bytes = string_to_bytes(plaintext);
  const blocks = createBlocks(bytes);
  const roundKeys = expandKey(key);
  const cipherBlocks: Matrix[] = [];

  for (const block of blocks) {
    let state = addRoundKey(block, roundKeys[0]);
    let a = print_mstr(state);
    for (let round = 1; round < 10; round++) {
      state = substitute(state, sboxEncrypt);
      state = shiftRows(state);
      state = mixColumns(state);
      state = addRoundKey(state, roundKeys[round]);
    }
    state = substitute(state, sboxEncrypt);
    state = shiftRows(state);
    state = addRoundKey(state, roundKeys[10]);
    cipherBlocks.push(inverseOrder(state));
  }
  const cipherBytes = cipherBlocks.flat();
  return bytes_to_string(cipherBytes);
}

export function decrypt(ciphertext: string, key: Matrix): string {
  const bytes = string_to_bytes(ciphertext);
  const blocks = createBlocks(bytes);
  const roundKeys = expandKey(key);
  const plainBlocks: Matrix[] = [];
  for (const block of blocks) {
    let state = addRoundKey(block, roundKeys[10]);
    for (let round = 9; round >= 1; round--) {
      state = invShiftRows(state);
      state = substitute(state, sboxDecrypt);
      state = addRoundKey(state, roundKeys[round]);
      state = inverseMixColumns(state);
    }
    state = invShiftRows(state);
    state = substitute(state, sboxDecrypt);
    state = addRoundKey(state, roundKeys[0]);
    plainBlocks.push(inverseOrder(state));
  }
  const plainBytes = plainBlocks.flat();
  const padLength = plainBytes[plainBytes.length - 1];
  const result = plainBytes.slice(0, plainBytes.length - padLength);
  return bytes_to_string(result);
}

export function print_mstr(m: Matrix): string {
  let str = "";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      str += `${m[4 * j + i].toString(16).padStart(2, "0")}`;
    }
    str += " ";
  }
  return str;
}
