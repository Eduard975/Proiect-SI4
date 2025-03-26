import { sboxDecrypt } from "./consts";
import {
  uInt8Mult,
  breakIntoColumns,
  reassembleMatrix,
  Matrix,
  substitute,
} from "./utils";
import { addRoundKey, generateKeySchedule } from "./utils-key";

export function inverseShiftRows(matrix: Matrix): Matrix {
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
  ];
}

function inverseMixColumn(column: number[]): number[] {
  const arr = [0, 0, 0, 0];
  arr[0] =
    uInt8Mult(0x0e, column[0]) ^
    uInt8Mult(0x0b, column[1]) ^
    uInt8Mult(0x0d, column[2]) ^
    uInt8Mult(0x09, column[3]);
  arr[1] =
    uInt8Mult(0x09, column[0]) ^
    uInt8Mult(0x0e, column[1]) ^
    uInt8Mult(0x0b, column[2]) ^
    uInt8Mult(0x0d, column[3]);
  arr[2] =
    uInt8Mult(0x0d, column[0]) ^
    uInt8Mult(0x09, column[1]) ^
    uInt8Mult(0x0e, column[2]) ^
    uInt8Mult(0x0b, column[3]);
  arr[3] =
    uInt8Mult(0x0b, column[0]) ^
    uInt8Mult(0x0d, column[1]) ^
    uInt8Mult(0x09, column[2]) ^
    uInt8Mult(0x0e, column[3]);
  return arr;
}

export function inverseMixColumns(matrix: Matrix): Matrix {
  const columns = breakIntoColumns(matrix);
  return reassembleMatrix(columns.map(inverseMixColumn));
}

export function decrypt(input: Matrix, key: Matrix): Matrix {
  let state = input;
  const keySchedule = generateKeySchedule(key);
  state = addRoundKey(state, keySchedule[10]);

  for (let round = 9; round > 0; round--) {
    state = inverseShiftRows(state);
    state = substitute(state, sboxDecrypt);
    state = addRoundKey(state, keySchedule[round]);
    state = inverseMixColumns(state);
  }

  state = inverseShiftRows(state);
  state = substitute(state, sboxDecrypt);
  state = addRoundKey(state, keySchedule[0]);

  return state;
}
