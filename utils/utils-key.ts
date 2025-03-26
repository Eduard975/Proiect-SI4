import { Rcon, sboxEncrypt } from "./consts";
import { breakIntoColumns, Matrix, reassembleMatrix } from "./utils";

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
