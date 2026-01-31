// src/lib/auth.ts
import { Discord } from "arctic";

export const discord = new Discord(
  import.meta.env.DISCORD_CLIENT_ID!,
  import.meta.env.DISCORD_CLIENT_SECRET!,
  import.meta.env.DISCORD_REDIRECT_URI!
);

export const STATE_COOKIE = "discord_oauth_state";
export const CODE_VERIFIER_COOKIE = "discord_code_verifier";
export const SESSION_COOKIE = "pmc_session";

export const cookieOptions = {
  httpOnly: true,   // JS no puede leer la cookie
  secure: false,     // HTTPS obligatorio en producción
  sameSite: "lax" as const,
  path: "/",
};
