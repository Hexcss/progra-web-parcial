import * as argon2 from 'argon2';

const ARGON2_TYPES = {
  argon2i: argon2.argon2i,
  argon2d: argon2.argon2d,
  argon2id: argon2.argon2id,
} as const;

type Argon2Type = (typeof ARGON2_TYPES)[keyof typeof ARGON2_TYPES];

const parseNum = (v: string | undefined, d: number) =>
  Number.isFinite(Number(v)) ? Number(v) : d;

function getOptions(): argon2.Options & { type: Argon2Type } {
  const typeStr = (process.env.ARGON2_TYPE ?? 'argon2id').toLowerCase();
  const type =
    typeStr === 'argon2i' ? argon2.argon2i :
    typeStr === 'argon2d' ? argon2.argon2d :
    argon2.argon2id;

  return {
    type,
    memoryCost: parseNum(process.env.ARGON2_MEMORY_COST, 19456),    
    timeCost: parseNum(process.env.ARGON2_TIME_COST, 2),
    parallelism: parseNum(process.env.ARGON2_PARALLELISM, 1),
  };
}

export async function hashString(plain: string): Promise<string> {
  return argon2.hash(plain, getOptions());
}

export async function verifyHash(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
