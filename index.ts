console.log("hihi");

import { sboxEncrypt, sboxDecrypt } from "./consts";
import {
	createBlocks,
	inverseOrder,
	type Matrix,
	printMatrix,
	string_to_bytes,
	substitute,
	
} from "./utils";

const test2: Matrix = [
	0x74, 0x6c, 0xe1, 0x09, 0xc5, 0x1e, 0xdd, 0x3b, 0xdf, 0x93, 0x79, 0xc7, 0x3c,
	0x62, 0xb0, 0xe7,
];

printMatrix(inverseOrder(test2));
console.log();
printMatrix(substitute(inverseOrder(test2), sboxEncrypt));

createBlocks(string_to_bytes("aashdashsdhasdh"));

console.log()