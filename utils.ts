import { sbox_decrypt, sbox_encrypt } from "./consts";

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
	number,
];

export function create_blocks(bytes: number[]): Matrix[] {
	const result: Matrix[] = [];
	const x = bytes.length;

	for (let i = 0; i < x; i += 16) {
		const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		const slice = bytes.slice(i, i + 16);
		for (let j = 0; j < 16; j++) {
			if (j < slice.length) arr[j] = slice[j];
			else arr[j] = 16 - slice.length;
		}
		result.push(inverse_order(arr));
	}

	return result;
}

export function inverse_order(matrix: Matrix): Matrix {
	const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			arr[4 * j + i] = matrix[4 * i + j];
		}
	}
	return arr;
}

export function print_matrix(matrix: Matrix) {
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			process.stdout.write(`${matrix[4 * i + j].toString(16)} `);
		}
		process.stdout.write("\n");
	}
}

export function substitute_encrypt(matrix: Matrix): Matrix {
	const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (let i = 0; i < 16; i++) {
		arr[i] = sbox_encrypt[matrix[i]];
	}
	return arr;
}

export function substitute_decrypt(matrix: Matrix): Matrix {
	const arr: Matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (let i = 0; i < 16; i++) {
		arr[i] = sbox_decrypt[arr[i]];
	}
	return arr;
}

export type Word = [number, number, number, number];

export function rotWord(x: Word): Word {
	return [x[3], x[0], x[1], x[2]];
}

export function substituteWordEncrypt(x: Word): Word {
	return [
		sbox_encrypt[x[0]],
		sbox_encrypt[x[1]],
		sbox_encrypt[x[2]],
		sbox_encrypt[x[3]],
	];
}

const Rcon: number[] = [
	0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36,
];

export function rconWord(x: Word, round: number): Word {
	return [x[0] ^ Rcon[round], x[1], x[2], x[3]];
}
