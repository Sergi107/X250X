import { Client, GatewayIntentBits } from "discord.js";
import fs from "node:fs/promises";

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================
const OPERATOR_MAPPING: Record<string, string> = {
    "155365437895639040": "Anakin_Machote",
    "253629694149132289": "Antonio",
    "293455180479856641": "Manuel2101",
    "486163046381912083": "Opposed",
    "424210391535714304": "andre",
    "1177709883529896056": "marti",
    "867052965931384903": "DIDAC",
    "687883552083542059": "Dear Vera",
    "330494281418539013": "Foxtrot 7",
    "949864607760146512": "Tomas",
    "978681614395645993": "Migl",
    "753710299680604281": "Rott",
    "1177627126120325130": "kiku",
    "1462167750683263120": "Sld. Calpe",
};

export const ROLE_IDS = {
    ARMA3: "958402329151963156",
    COMANDANTE: "632621611417337876",
    BRIGADA: "793105882887880715",
    SARGENTO: "607883924668022795",
    CABO: "793105366632235010",
    SOLDADO: "793105017909018685",
    MEDICO: "1292861291660181616",
    AMETRALLADOR: "1292861922630172692",
    BREACHER: "1292861818133286915",
    FUSILERO_AT: "1292862032789635112",
    FUSILERO_AA: "1295488870485327902",
    RADIO: "1292861593431965767",
    ZAPADOR: "1292861710578880542",
    STAFF: "1087092702526582894",
    EDITOR: "1296086192013709365",
};

const CHANNELS = { MEDALS_LOG: "974652223416057926" };
const JSON_STATS_URL = "https://pmc250.com/datos_misiones_historico.json";
const MEDALS_DB_PATH = "./medals_db.json";
const CACHE_TTL = 5 * 60 * 1000;

export const specialtyConfig: any = {
    Staff: { color: "text-orange-400" },
    Editor: { color: "text-blue-400" },
    Médico: { color: "text-red-400" },
    Ametrallador: { color: "text-yellow-500" },
    Breacher: { color: "text-purple-400" },
    "Fusilero AT": { color: "text-green-400" },
    "Fusilero AA": { color: "text-cyan-400" },
    "Radio Operador": { color: "text-indigo-400" },
    Zapador: { color: "text-orange-600" },
    Fusilero: { color: "text-gray-400" },
};

export const ranksOrder = ["Comandante", "Brigada", "Sargento", "Cabo", "Soldado"];

// --- DEFINICIONES BASE DE MEDALLAS Y LOGROS ---
const BASE_MEDALS = [
    { id: "participation", name: "Deber Cumplido (+90% Asistencia)", icon: "Activity", achieved: false },
    { id: "kills_500", name: "Exterminador (+500 Bajas)", icon: "Skull", achieved: false },
    { id: "survival", name: "Superviviente (+90% Supervivencia)", icon: "ShieldCheck", achieved: false },
    { id: "hours_100", name: "Veterano de Combate (+100 Horas)", icon: "Clock", achieved: false },
    { id: "years_3", name: "Vieja Guardia (+3 Años)", icon: "Crown", achieved: false },
];

const BASE_ACHIEVEMENTS = [
    { id: "a_first", name: "Primer Paso", desc: "5 Misiones Completadas", icon: "Footprints", achieved: false },
    { id: "a_ten", name: "Regular", desc: "15 Misiones Completadas", icon: "Users", achieved: false },
    { id: "a_kill", name: "Primeros Contactos", desc: "50 Bajas confirmadas", icon: "Crosshair", achieved: false },
    { id: "a_time", name: "Recluta", desc: "20h de servicio", icon: "Clock", achieved: false },
    { id: "a_inf", name: "Grunt", desc: "50 Bajas Infantería", icon: "Sword", achieved: false },
    { id: "a_at", name: "Abrelatas", desc: "10 Bajas Blindados", icon: "Shield", achieved: false },
    { id: "a_aa", name: "No Fly Zone", desc: "10 Bajas Aéreas", icon: "Plane", achieved: false },
    { id: "a_demo", name: "Demolición", desc: "15 Bajas Soft/Edificios", icon: "Bomb", achieved: false },
    { id: "a_vet", name: "Soldado", desc: "50h de servicio", icon: "Star", achieved: false },
    { id: "a_life", name: "Experimentado", desc: "100h de servicio", icon: "Hourglass", achieved: false },
    { id: "a_surv", name: "Inmortal", desc: "0 Muertes en 5 Misiones seguidas", icon: "Ghost", achieved: false },
    { id: "a_term", name: "Terminator", desc: "+20 Kills en una misión", icon: "Zap", achieved: false },
    { id: "a_1k", name: "La Parca", desc: "+1000 Bajas Totales", icon: "Skull", achieved: false },
    { id: "a_kd", name: "Sharpshooter", desc: "K/D Ratio > 2.0", icon: "Target", achieved: false },
    { id: "a_hero", name: "Héroe", desc: "Supervivencia Global > 75%", icon: "Heart", achieved: false },
    { id: "a_top", name: "Leyenda", desc: "Top 10% Asistencia", icon: "Trophy", achieved: false },
];

const globalAny = globalThis as any;
globalAny.orbatCache = globalAny.orbatCache || {
    data: [],
    lastFetch: 0,
    isFetching: false
};

async function fetchOrbatDataInternal() {
    console.log("🔄 [SERVICE] Sincronizando datos de Orbat...");
    const DISCORD_TOKEN = import.meta.env.DISCORD_TOKEN?.trim();
    const GUILD_ID = import.meta.env.GUILD_ID?.trim();

    if (!DISCORD_TOKEN || !GUILD_ID) {
        console.error("❌ [SERVICE] Faltan credenciales .env");
        return [];
    }

    try {
        const [jsonResponse, client, dbFileContent] = await Promise.all([
            fetch(JSON_STATS_URL).then(r => r.ok ? r.json() : []).catch(() => []),
            new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] }).login(DISCORD_TOKEN).then(async () => {
                 const c = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] });
                 await c.login(DISCORD_TOKEN);
                 return c;
            }),
            fs.readFile(MEDALS_DB_PATH, "utf-8").catch(() => "{}")
        ]);

        let playerStatsMap: Record<string, any> = {};
        let statsLookupMap: Record<string, any> = {};
        const missions = jsonResponse || [];
        const globalTotalMissions = missions.length;

        missions.forEach((mission: any) => {
            if (mission.players && Array.isArray(mission.players)) {
                mission.players.forEach((p: any) => {
                    const pName = p.name;
                    if (!playerStatsMap[pName]) {
                        playerStatsMap[pName] = {
                            totalMissions: 0, totalPlaytime: 0, totalKills: 0, totalDeaths: 0,
                            breakdown: { inf: 0, armor: 0, air: 0, soft: 0 },
                            bestMission: { name: "N/A", kills: -1 },
                            worstMission: { name: "N/A", deaths: -1 },
                            history: []
                        };
                        statsLookupMap[pName.toLowerCase()] = playerStatsMap[pName];
                    }
                    const stats = playerStatsMap[pName];
                    stats.totalMissions++;
                    stats.totalPlaytime += mission.duration_sec || 0;
                    stats.totalKills += p.killsTotal || 0;
                    stats.totalDeaths += p.killed || 0;
                    stats.breakdown.inf += p.killsInfantry || 0;
                    stats.breakdown.armor += p.killsArmor || 0;
                    stats.breakdown.air += p.killsAir || 0;
                    stats.breakdown.soft += p.killsSoft || 0;
                    stats.history.push({ name: mission.mission, date: mission.date || "N/A", duration: mission.duration_sec || 0, kills: p.killsTotal || 0, deaths: p.killed || 0 });
                    if (p.killsTotal > stats.bestMission.kills) stats.bestMission = { name: mission.mission, kills: p.killsTotal };
                    if (p.killed > stats.worstMission.deaths) stats.worstMission = { name: mission.mission, deaths: p.killed };
                });
            }
        });

        const guild = await client.guilds.fetch(GUILD_ID);
        const members = await guild.members.fetch({ withPresences: true });
        let medalsDB = JSON.parse(dbFileContent);
        
        const finalData = await Promise.all(members.map(async (m) => {
            const roles = m.roles.cache;
            if (!roles.has(ROLE_IDS.ARMA3)) return null;

            const isAdmin = roles.has(ROLE_IDS.STAFF);

            let rank = "Invitado";
            if (roles.has(ROLE_IDS.COMANDANTE)) rank = "Comandante";
            else if (roles.has(ROLE_IDS.BRIGADA)) rank = "Brigada";
            else if (roles.has(ROLE_IDS.SARGENTO)) rank = "Sargento";
            else if (roles.has(ROLE_IDS.CABO)) rank = "Cabo";
            else if (roles.has(ROLE_IDS.SOLDADO)) rank = "Soldado";

            let specialty = "Fusilero";
            if (roles.has(ROLE_IDS.STAFF)) specialty = "Staff";
            else if (roles.has(ROLE_IDS.EDITOR)) specialty = "Editor";
            else if (roles.has(ROLE_IDS.MEDICO)) specialty = "Médico";
            else if (roles.has(ROLE_IDS.AMETRALLADOR)) specialty = "Ametrallador";
            else if (roles.has(ROLE_IDS.BREACHER)) specialty = "Breacher";
            else if (roles.has(ROLE_IDS.ZAPADOR)) specialty = "Zapador";
            else if (roles.has(ROLE_IDS.RADIO)) specialty = "Radio Operador";
            else if (roles.has(ROLE_IDS.FUSILERO_AT)) specialty = "Fusilero AT";
            else if (roles.has(ROLE_IDS.FUSILERO_AA)) specialty = "Fusilero AA";

            let linkedStats = null;
            const manualName = OPERATOR_MAPPING[m.id];
            if (manualName) {
                linkedStats = playerStatsMap[manualName];
            } else {
                const cleanName = m.displayName.replace(/\[.*?\]/g, "").trim().toLowerCase();
                linkedStats = statsLookupMap[cleanName];
                if (!linkedStats) {
                    const key = Object.keys(statsLookupMap).find((k) => k.includes(cleanName));
                    if (key) linkedStats = statsLookupMap[key];
                }
            }

            // --- INICIO: LÓGICA DE CÁLCULO DE MÉTRICAS Y LOGROS ---
            let attCalc = "0%", attColor = "text-red-500";
            let customStats: any[] = [];
            
            // Clonamos las definiciones base para este usuario
            let userMedals = JSON.parse(JSON.stringify(BASE_MEDALS));
            let userAchievements = JSON.parse(JSON.stringify(BASE_ACHIEVEMENTS));
            
            // Recuperamos medallas guardadas manualmente en DB
            const savedMedalIds = medalsDB[m.id] || [];

            if (linkedStats && globalTotalMissions > 0) {
                // Métricas básicas
                const pct = (linkedStats.totalMissions / globalTotalMissions) * 100;
                attCalc = pct.toFixed(1) + "%";
                if (pct >= 75) attColor = "text-green-500";
                else if (pct >= 50) attColor = "text-blue-400";
                else if (pct >= 25) attColor = "text-yellow-500";

                const survivalRate = linkedStats.totalMissions > 0 ? 1 - linkedStats.totalDeaths / linkedStats.totalMissions : 0;
                const hours = Math.floor(linkedStats.totalPlaytime / 3600);
                const years = m.joinedAt ? (Date.now() - m.joinedAt.getTime()) / 3.154e10 : 0;
                const kd = linkedStats.totalDeaths > 0 ? linkedStats.totalKills / linkedStats.totalDeaths : linkedStats.totalKills;

                customStats.push(
                    { label: "Supervivencia", value: `${(survivalRate * 100).toFixed(0)}%`, color: "text-blue-400" },
                    { label: "Bajas Totales", value: linkedStats.totalKills, color: "text-red-400" },
                    { label: "Horas Combate", value: hours, color: "text-white" }
                );

                // --- LÓGICA DE ACTIVACIÓN DE MEDALLAS ---
                // 1. Marcar como conseguidas si cumplen requisitos automáticos
                if (pct >= 90) userMedals.find((x:any) => x.id === "participation").achieved = true;
                if (linkedStats.totalKills >= 500) userMedals.find((x:any) => x.id === "kills_500").achieved = true;
                if (survivalRate >= 0.9 && linkedStats.totalMissions > 10) userMedals.find((x:any) => x.id === "survival").achieved = true;
                if (hours >= 100) userMedals.find((x:any) => x.id === "hours_100").achieved = true;
                if (years >= 3) userMedals.find((x:any) => x.id === "years_3").achieved = true;

                // 2. Marcar como conseguidas si están en la DB (Manuales o antiguas)
                userMedals.forEach((m: any) => {
                    if (savedMedalIds.includes(m.id)) m.achieved = true;
                });

                // --- LÓGICA DE ACTIVACIÓN DE LOGROS (ACHIEVEMENTS) ---
                if (linkedStats.totalMissions >= 5) userAchievements.find((x:any) => x.id === "a_first").achieved = true;
                if (linkedStats.totalMissions >= 15) userAchievements.find((x:any) => x.id === "a_ten").achieved = true;
                if (linkedStats.totalKills >= 50) userAchievements.find((x:any) => x.id === "a_kill").achieved = true;
                if (hours >= 20) userAchievements.find((x:any) => x.id === "a_time").achieved = true;
                if (linkedStats.breakdown.inf >= 50) userAchievements.find((x:any) => x.id === "a_inf").achieved = true;
                if (linkedStats.breakdown.armor >= 10) userAchievements.find((x:any) => x.id === "a_at").achieved = true;
                if (linkedStats.breakdown.air >= 10) userAchievements.find((x:any) => x.id === "a_aa").achieved = true;
                if (linkedStats.breakdown.soft >= 15) userAchievements.find((x:any) => x.id === "a_demo").achieved = true;
                if (hours >= 50) userAchievements.find((x:any) => x.id === "a_vet").achieved = true;
                if (hours >= 100) userAchievements.find((x:any) => x.id === "a_life").achieved = true;
                if (survivalRate >= 0.8 && linkedStats.totalMissions > 5) userAchievements.find((x:any) => x.id === "a_surv").achieved = true;
                if (linkedStats.bestMission.kills >= 20) userAchievements.find((x:any) => x.id === "a_term").achieved = true;
                if (linkedStats.totalKills >= 1000) userAchievements.find((x:any) => x.id === "a_1k").achieved = true;
                if (kd >= 2.0 && linkedStats.totalKills > 50) userAchievements.find((x:any) => x.id === "a_kd").achieved = true;
                if (survivalRate >= 0.75 && linkedStats.totalMissions > 20) userAchievements.find((x:any) => x.id === "a_hero").achieved = true;
                if (pct >= 80) userAchievements.find((x:any) => x.id === "a_top").achieved = true;
            }

            return {
                id: m.id,
                name: m.displayName,
                avatar: m.user.displayAvatarURL({ extension: "png", size: 256 }),
                rank, specialty, isAdmin,
                status: m.presence?.status || "offline",
                joinedAt: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("es-ES") : "N/A",
                joinedAtRaw: m.joinedAt,
                stats: linkedStats,
                attendance: attCalc,
                attendanceColor: attColor,
                roles: roles.filter((r: any) => r.name !== "@everyone").map((r: any) => r.name),
                customStats: customStats,
                medals: userMedals,       // DEVUELVE EL ARRAY CALCULADO
                achievements: userAchievements // DEVUELVE EL ARRAY CALCULADO
            };
        }));

        await client.destroy();
        return finalData.filter(m => m !== null);

    } catch (e) {
        console.error("Error en servicio Orbat:", e);
        return [];
    }
}

export async function getOrbatData() {
    const now = Date.now();
    if (globalAny.orbatCache.data.length > 0 && (now - globalAny.orbatCache.lastFetch < CACHE_TTL)) {
        return globalAny.orbatCache.data;
    }
    if (globalAny.orbatCache.isFetching) return globalAny.orbatCache.data;

    globalAny.orbatCache.isFetching = true;
    const data = await fetchOrbatDataInternal();
    
    if (data.length > 0) {
        globalAny.orbatCache = { data, lastFetch: now, isFetching: false };
    } else {
        globalAny.orbatCache.isFetching = false;
    }
    return globalAny.orbatCache.data;
}