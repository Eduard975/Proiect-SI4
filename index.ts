console.log("hihi");

import { sbox_encrypt, sbox_decrypt } from "./consts";
import { string_to_bytes } from "./utils"
const test = 0x74;

console.log(sbox_encrypt[test])
console.log(string_to_bytes("test"))
