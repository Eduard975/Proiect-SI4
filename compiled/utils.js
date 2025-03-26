"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.string_to_bytes = string_to_bytes;
exports.createBlocks = createBlocks;
exports.inverseOrder = inverseOrder;
exports.printMatrix = printMatrix;
exports.substitute = substitute;
exports.shiftRows = shiftRows;
const consts_1 = require("./consts");
function string_to_bytes(text) {
    const result = [];
    for (const element of text) {
        result.push(element.charCodeAt(0));
    }
    return result;
}
function createBlocks(bytes) {
    const result = [];
    const x = bytes.length;
    for (let i = 0; i < x; i += 16) {
        const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const slice = bytes.slice(i, i + 16);
        for (let j = 0; j < 16; j++) {
            if (j < slice.length)
                arr[j] = slice[j];
            else
                arr[j] = 16 - slice.length;
        }
        result.push(inverseOrder(arr));
    }
    return result;
}
function inverseOrder(matrix) {
    const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            arr[4 * j + i] = matrix[4 * i + j];
        }
    }
    return arr;
}
function printMatrix(matrix) {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            process.stdout.write(`${matrix[4 * i + j].toString(16)} `);
        }
        process.stdout.write("\n");
    }
}
function substitute(matrix, sbox = consts_1.sboxEncrypt) {
    const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 16; i++) {
        arr[i] = sbox[matrix[i]];
    }
    return arr;
}
function shiftRows(matrix) {
    const arr = [
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
//# sourceMappingURL=utils.js.map