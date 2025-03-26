"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log("hihi");
const consts_1 = require("./consts");
const utils_1 = require("./utils");
const test2 = [
    0x74, 0x6c, 0xe1, 0x09, 0xc5, 0x1e, 0xdd, 0x3b, 0xdf, 0x93, 0x79, 0xc7, 0x3c,
    0x62, 0xb0, 0xe7,
];
(0, utils_1.printMatrix)((0, utils_1.inverseOrder)(test2));
console.log();
const subs = (0, utils_1.substitute)((0, utils_1.inverseOrder)(test2), consts_1.sboxEncrypt);
(0, utils_1.printMatrix)(subs);
const shifted = (0, utils_1.shiftRows)(subs);
console.log();
(0, utils_1.printMatrix)(shifted);
console.log();
//# sourceMappingURL=index.js.map