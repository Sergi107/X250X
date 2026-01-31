// src/pages/api/auth/discord.ts
import type { APIRoute } from "astro";
import { generateState, generateCodeVerifier } from "arctic";
import { discord, STATE_COOKIE, CODE_VERIFIER_COOKIE, cookieOptions } from "../../../lib/auth";
import { serialize } from "cookie";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/perfil";

  // Guardamos csrf y next en state
  const statePayload = JSON.stringify({ csrf: generateState(), next });
  const codeVerifier = generateCodeVerifier();

  const discordUrl = await discord.createAuthorizationURL(
    statePayload,
    codeVerifier,
    ["identify", "guilds.members.read"]
  );

  const headers = new Headers();
  headers.append("Set-Cookie", serialize(STATE_COOKIE, statePayload, { ...cookieOptions, maxAge: 600 }));
  headers.append("Set-Cookie", serialize(CODE_VERIFIER_COOKIE, codeVerifier, { ...cookieOptions, maxAge: 600 }));
  headers.append("Location", discordUrl.toString());

  return new Response(null, { status: 302, headers });
};
