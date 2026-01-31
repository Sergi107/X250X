import { discord, SESSION_COOKIE, cookieOptions, CODE_VERIFIER_COOKIE, STATE_COOKIE } from "../../../lib/auth"; 
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	
    // Recuperamos las cookies de seguridad
    const storedState = cookies.get(STATE_COOKIE)?.value;
    const storedCodeVerifier = cookies.get(CODE_VERIFIER_COOKIE)?.value;

    // 1. Validar OAuth
	if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response("Error de validación OAuth", { status: 400 });
	}

	try {
        // 2. Canjear el código
		const tokens = await discord.validateAuthorizationCode(code, storedCodeVerifier);
        
        // CORRECCIÓN AQUÍ: tokens.accessToken() es una función, hay que llamarla con ()
        const accessToken = tokens.accessToken(); 

        // 3. Obtener datos del usuario de Discord
		const response = await fetch("https://discord.com/api/users/@me", {
			headers: {
				Authorization: `Bearer ${accessToken}` // Usamos la variable con el string ya extraído
			}
		});
		const discordUser = await response.json();

        // 4. Preparar sesión
        const sessionData = {
            id: discordUser.id,
            username: discordUser.username,
            avatar: discordUser.avatar,
            exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 días
        };

        // 5. Guardar cookie
        const buffer = Buffer.from(JSON.stringify(sessionData));
        const sessionString = buffer.toString('base64');

		cookies.set(SESSION_COOKIE, sessionString, {
            ...cookieOptions,
            maxAge: 60 * 60 * 24 * 7
        });

        // 6. Redirigir
		return redirect("/perfil");

	} catch (e) {
        console.error("Error en callback OAuth:", e);
		return new Response("Error interno del servidor durante el login", { status: 500 });
	}
};