const fastPrime = require('fast-prime');

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

// function isPrime(num: bigint): boolean {
//     if (num < 2n) return false;
//     for (let i = 2n; i * i <= num; i++) {
//         if (num % i === 0n) return false;
//     }
//     return true;
// }

function modInverse(a: bigint, m: bigint): bigint {
    let m0 = m, x0 = 0n, x1 = 1n;

    if (m === 1n) return 0n;
    let q = a / m;
    let t = m;

    while (a > 1n) {
        q = a / m;
        t = m;
        m = a % m;
        a = t;
        t = x0;
        x0 = x1 - q * x0;
        x1 = t;
    }

    if (x1 < 0n) x1 += m0;

    return x1;
}

//FOARTE SLOW TRB SCHIMBAT CUMVA, PROBABIL CU LUT(Look Up Table) SAU CIURUL LUI ERASTOSTENE SAU 2P-Q
async function getRandomPrime(bitSize: number = 8) {
    const prime = await fastPrime.random.prime(bitSize);
    console.log(prime)
    return BigInt(prime);
  }


async function generateKeyPair(bitSizeForGeneratedPrimeNum: number = 8): Promise<{ publicKey: { e: bigint; n: bigint }; 
                                            privateKey: { d: bigint; n: bigint }; }> {
    const p =  await getRandomPrime(bitSizeForGeneratedPrimeNum);
    const q =  await getRandomPrime(bitSizeForGeneratedPrimeNum);

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    let e = 17n;
    while (gcd(e, phi) !== 1n) {
        e += 2n;
    }

    const d = modInverse(e, phi);

    return { publicKey: { e, n }, privateKey: { d, n } };
}

function encryptMessage(message: string, publicKey: { e: bigint; n: bigint }): bigint[] {
    return message.split('').map(char => modExp(BigInt(char.charCodeAt(0)), publicKey.e, publicKey.n));
}

function decryptMessage(encryptedMessage: bigint[], privateKey: { d: bigint; n: bigint }): string {
    return encryptedMessage.map(char => String.fromCharCode(Number(modExp(char, privateKey.d, privateKey.n)))).join('');
}

// Test Code
// generateKeyPair(16).then(keys => {
//     const publicKey = keys.publicKey;
//     const privateKey = keys.privateKey;

//     console.log('Public Key:', publicKey);
//     console.log('Private Key:', privateKey);

//     const message = 'Hello';
//     const encrypted = encryptMessage(message, publicKey);
//     console.log('Encrypted Message:', encrypted);

//     const decrypted = decryptMessage(encrypted, privateKey);
//     console.log('Decrypted Message:', decrypted);
// });
