import { Rcon, sboxEncrypt } from "./consts";

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

export function stringToBytes(text: string): number[] {
  const result: number[] = [];

  for (const element of text) {
    result.push(element.charCodeAt(0));
  }

  if (result.length > 16) {
    throw Error("Mesajul poate avea maxim 16 caractere");
  } else if (result.length < 16) {
    const temp = 16 - result.length;
    for (let i = 0; i < temp; i++) {
      result.push(temp);
      // Daca avem sub 16 caractere atunci umplem
      // fiecare octet ramas cu o copie a numarului de octeti ramasi
    }
  }
  return result;
}

export function bytesToString(bytes: Matrix): String {
  const paddingValue = bytes[bytes.length - 1];
  const isValidPadding = bytes
    .slice(-paddingValue)
    .every((b) => b === paddingValue);
  return isValidPadding
    ? String.fromCharCode(...bytes.slice(0, -paddingValue))
    : String.fromCharCode(...bytes);
}

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
    result.push(transposeMatrix(arr));
  }

  return result;
}

export function transposeMatrix(matrix: Matrix): Matrix {
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

export function uInt8Mult(a: number, b: number): number {
  let result = 0;
  let willOverflow = 0;

  for (let i = 0; i < 8; i++) {
    if (b & 1) {
      result ^= a;
    }

    willOverflow = a & 0x80;
    a = (a << 1) & 0xff;

    if (willOverflow != 0) {
      a ^= 0x1b;
    }

    b >>= 1;
  }

  return result;
}

function mixColumn(column: number[]): number[] {
  const arr: number[] = [0, 0, 0, 0];

  arr[0] =
    uInt8Mult(0x02, column[0]) ^
    uInt8Mult(0x03, column[1]) ^
    column[2] ^
    column[3];
  arr[1] =
    column[0] ^
    uInt8Mult(0x02, column[1]) ^
    uInt8Mult(0x03, column[2]) ^
    column[3];
  arr[2] =
    column[0] ^
    column[1] ^
    uInt8Mult(0x02, column[2]) ^
    uInt8Mult(0x03, column[3]);
  arr[3] =
    uInt8Mult(0x03, column[0]) ^
    column[1] ^
    column[2] ^
    uInt8Mult(0x02, column[3]);

  return arr;
}

export function breakIntoColumns(matrix: Matrix): number[][] {
  const columns: number[][] = [[], [], [], []];
  for (let i = 0; i < 16; i++) {
    columns[i % 4].push(matrix[i]);
  }
  return columns;
}

export function reassembleMatrix(columns: number[][]): Matrix {
  // for (let e of columns[0]) process.stdout.write(e.toString(16));
  // console.log();
  return [
    columns[0][0],
    columns[1][0],
    columns[2][0],
    columns[3][0],
    columns[0][1],
    columns[1][1],
    columns[2][1],
    columns[3][1],
    columns[0][2],
    columns[1][2],
    columns[2][2],
    columns[3][2],
    columns[0][3],
    columns[1][3],
    columns[2][3],
    columns[3][3],
  ];
}

export function mixColumns(matrix: Matrix): Matrix {
  const columns = breakIntoColumns(matrix);
  const mixedColumns: number[][] = [];

  for (let i = 0; i < 4; i++) {
    mixedColumns.push(mixColumn(columns[i]));
  }

  return reassembleMatrix(mixedColumns);
}

export function rotWord(column: number[]): number[] {
  return [column[1], column[2], column[3], column[0]];
}

export function subWord(
  matrix: number[],
  sbox: number[] = sboxEncrypt
): number[] {
  const arr: number[] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    arr[i] = sbox[matrix[i]];
  }

  return arr;
}

export function addWord(a: number[], b: number[]): number[] {
  const arr: number[] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    arr[i] = (a[i] ^ b[i]) & 0xff;
  }

  return arr;
}

export function addRoundKey(matrix: Matrix, roundKey: Matrix): Matrix {
  const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 16; i++) {
    // console.log(matrix[i].toString(16), roundKey[i].toString(16));
    arr[i] = (matrix[i] ^ roundKey[i]) & 0xff;
  }

  return arr;
}

export function generateKeySchedule(key: Matrix): Matrix[] {
  const keySchedule: Matrix[] = [];
  keySchedule.push(key);

  let words = breakIntoColumns(key);

  for (let i = 0; i < 10; i++) {
    const prevWord = words[3];

    let temp = rotWord(prevWord);
    temp = subWord(temp);
    temp = addWord(temp, Rcon[i]);

    const newWords: number[][] = [];

    newWords[0] = addWord(words[0], temp);

    for (let j = 1; j < 4; j++) {
      newWords[j] = addWord(words[j], newWords[j - 1]);
    }

    keySchedule.push(reassembleMatrix(newWords));
    words = newWords;
  }

  return keySchedule;
}

export function encrypt(input: Matrix, key: Matrix): Matrix {
  let state = input;
  const keySchedule = generateKeySchedule(key);
  state = addRoundKey(state, keySchedule[0]);
  // console.log("----Round " + 0);
  // printMatrix(state);
  // console.log();
  for (let round = 1; round < 10; round++) {
    // console.log("----Round " + round);
    // printMatrix(state);
    // console.log();

    state = shiftRows(state);
    // console.log("--After Shift ");
    // printMatrix(state);
    // console.log();

    state = substitute(state);
    // console.log("--After Subs ");
    // printMatrix(state);
    // console.log();

    state = mixColumns(state);
    // console.log("--After Mix ");
    // printMatrix(state);
    // console.log();

    state = addRoundKey(state, keySchedule[round]);

    // console.log("--After Add key ");
    // printMatrix(keySchedule[round]);
    // console.log();

    // printMatrix(state);
    // console.log();
  }

  state = substitute(state);
  state = shiftRows(state);
  state = addRoundKey(state, keySchedule[10]);

  // console.log("Round " + 10);
  // printMatrix(state);
  // console.log();
  // printMatrix(keySchedule[10]);
  // console.log();
  return state;
}
