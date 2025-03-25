console.log("hihi");

import { sbox_encrypt, sbox_decrypt } from "./consts";
import {
	create_blocks,
	inverse_order,
	type Matrix,
	print_matrix,
	string_to_bytes,
	substitute_encrypt,
} from "./utils";

const test2: Matrix = [
	0x74, 0x6c, 0xe1, 0x09, 0xc5, 0x1e, 0xdd, 0x3b, 0xdf, 0x93, 0x79, 0xc7, 0x3c,
	0x62, 0xb0, 0xe7,
];

print_matrix(inverse_order(test2));
console.log();
print_matrix(substitute_encrypt(inverse_order(test2)));

create_blocks(string_to_bytes("aashdashsdhasdh"));
