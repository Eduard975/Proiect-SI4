import { randomPrime } from "random-prime";

function modExp(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n;
    base = base % mod;
    while (exp > 0) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod;
        }
        exp = exp >> 1n;
        base = (base * base) % mod;
    }
    return result;
}

function gcd(a: bigint, b: bigint): bigint {
    return b === 0n ? a : gcd(b, a % b);
}

//FOARTE SLOW TRB SCHIMBAT CUMVA, PROBABIL CU LUT(Look Up Table) SAU CIURUL LUI ERASTOSTENE SAU 2P-Q
function getRandomPrime(min: number = 2, max: number = 100000): bigint {
    return BigInt(randomPrime({min, max})!)
}

function isPrime(num: bigint): boolean {
    if (num < 2n) return false;
    for (let i = 2n; i * i <= num; i++) {
        if (num % i === 0n) return false;
    }
    return true;
}

function generateKeyPair(): { publicKey: { e: bigint; n: bigint }; privateKey: { d: bigint; n: bigint } } {
    const p = getRandomPrime();
    const q = getRandomPrime();
    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    let e = 17n;
    while (gcd(e, phi) !== 1n) {
        e += 2n;
    }
    let d = 1n;
    while ((d * e) % phi !== 1n) {
        d += 1n;
    }
    return { publicKey: { e, n }, privateKey: { d, n } };
}

function encryptMessage(message: string, publicKey: { e: bigint; n: bigint }): bigint[] {
    return message.split('').map(char => modExp(BigInt(char.charCodeAt(0)), publicKey.e, publicKey.n));
}

function decryptMessage(encryptedMessage: bigint[], privateKey: { d: bigint; n: bigint }): string {
    return encryptedMessage.map(char => String.fromCharCode(Number(modExp(char, privateKey.d, privateKey.n)))).join('');
}

const { publicKey, privateKey } = generateKeyPair();
console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);

const message = 'Hello';
const encrypted = encryptMessage(message, publicKey);
console.log('Encrypted Message:', encrypted);

const decrypted = decryptMessage(encrypted, privateKey);
console.log('Decrypted Message:', decrypted);
