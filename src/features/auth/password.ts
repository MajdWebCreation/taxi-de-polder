import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

// promisify() verliest de overload met een options-argument, dus een eigen
// wrapper met het juiste type.
function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

// scrypt (RFC 7914) via node:crypto. Parameters volgen de aanbevelingen voor
// interactieve logins: N = 2^15, r = 8, p = 1, 64 bytes output.
const SCRYPT_COST = 2 ** 15;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
// scrypt heeft ongeveer 128 * N * r bytes nodig; de Node-standaard van 32 MB
// is te krap voor N = 2^15.
const MAX_MEMORY = 64 * 1024 * 1024;

const PREFIX = "scrypt";

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });
}

/** Formaat: scrypt$<N>$<r>$<p>$<salt base64>$<hash base64> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await derive(password, salt);

  return [
    PREFIX,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split("$");

  if (parts.length !== 6 || parts[0] !== PREFIX) {
    return false;
  }

  const [, costRaw, blockSizeRaw, parallelizationRaw, saltRaw, hashRaw] = parts;
  const cost = Number(costRaw);
  const blockSize = Number(blockSizeRaw);
  const parallelization = Number(parallelizationRaw);

  if (
    !Number.isInteger(cost) ||
    !Number.isInteger(blockSize) ||
    !Number.isInteger(parallelization)
  ) {
    return false;
  }

  const salt = Buffer.from(saltRaw, "base64");
  const expected = Buffer.from(hashRaw, "base64");

  const actual = await scryptAsync(
    password.normalize("NFKC"),
    salt,
    expected.length,
    {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: MAX_MEMORY,
    }
  );

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
