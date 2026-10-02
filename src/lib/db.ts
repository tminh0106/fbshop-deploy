import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// CSDL MySQL tren hosting dung chung thinh thoang tu choi ket noi moi khi nhieu truy van mo cung luc
// (P1001 khong ket noi duoc, P1002 het thoi gian, P1017 may chu dong ket noi, P2024 het thoi gian cho ket noi).
// Cac loi nay xay ra TRUOC khi truy van duoc thuc thi nen thu lai an toan.
const RETRYABLE = new Set(["P1001", "P1002", "P1017", "P2024"]);
const MAX_ATTEMPTS = 3;

function createClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  client.$use(async (params, next) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await next(params);
      } catch (err) {
        const code =
          err instanceof Prisma.PrismaClientKnownRequestError
            ? err.code
            : err instanceof Prisma.PrismaClientInitializationError
            ? err.errorCode
            : undefined;
        if (!code || !RETRYABLE.has(code) || attempt >= MAX_ATTEMPTS) throw err;
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
