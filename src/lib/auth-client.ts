// Fase 0 / módulo 11: cliente tipado de Better Auth para componentes React.
"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
console.log("[AuthClient] NEXT_PUBLIC_BETTER_AUTH_URL =", baseURL);

export const authClient = createAuthClient({ baseURL, plugins: [usernameClient()] });
export const { signIn, signOut, signUp, useSession, getSession } = authClient;
