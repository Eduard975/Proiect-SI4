export function string_to_bytes(text: string): number[] {
	const result: number[] = [];

	for (const element of text) {
		result.push(element.charCodeAt(0));
	}

	return result;
}

type Matrix = [
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
