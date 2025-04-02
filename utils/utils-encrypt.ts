import {
  breakIntoColumns,
  Matrix,
  reassembleMatrix,
  substitute,
  transposeMatrix,
  uInt8Mult,
} from "./utils";
import { addRoundKey, generateKeySchedule } from "./utils-key";

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

export function mixColumns(matrix: Matrix): Matrix {
  const columns = breakIntoColumns(matrix);
  const mixedColumns: number[][] = [];

  for (let i = 0; i < 4; i++) {
    mixedColumns.push(mixColumn(columns[i]));
  }

  return reassembleMatrix(mixedColumns);
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
  return transposeMatrix(state);
}
