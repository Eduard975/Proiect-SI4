import { sboxEncrypt } from "./consts";

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
