// Fase 0 / módulo 11: autenticación Better Auth con registro público deshabilitado.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/username": { window: 60, max: 10 },
      "/sign-in/email": { window: 60, max: 10 },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["admin", "supervisor", "operador_de_mesa", "delegado"],
        required: false,
        defaultValue: "delegado",
        input: false,
      },
      documento: { type: "string", required: false, input: false },
      telefono: { type: "string", required: false, input: false },
      torneoId: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = typeof user.email === "string" ? user.email.toLowerCase() : "";
          return {
            data: {
              ...user,
              role: user.role ?? (email === process.env.ADMIN_EMAIL?.toLowerCase() ? "admin" : "delegado"),
            },
          };
        },
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 2,
      usernameNormalization: (valor) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
    }),
    nextCookies(),
  ],
});
