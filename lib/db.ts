import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma';

const prismaClientSingleton = () => {
    console.log('Initializing new PrismaClient instance...');
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });
    console.log('Models on new client:', Object.keys(client).filter(k => !k.startsWith('$') && !k.startsWith('_')));
    return client;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma_v2: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma_v2 ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma;
