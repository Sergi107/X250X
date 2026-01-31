import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, LineChart, Line, ScatterChart, Scatter, ZAxis, PieChart, Pie
} from 'recharts';
import { 
  ShieldAlert, Users, TrendingUp, Activity, BrainCircuit, UserMinus, 
  Save, Search, Crosshair, AlertTriangle, UserCheck, X, 
  Calendar, Timer, Swords, FileText, Fingerprint, List, AlertOctagon, CheckCircle2,
  Skull, HeartCrack, ThumbsUp, ThumbsDown, Gauge, Trophy, Zap, PieChart as PieIcon, Filter
} from 'lucide-react';

// --- IMPORTANTE: CARGA DE DATOS LOCALES ---
import localData from '../datos_misiones_historico.json'; 

// --- CONFIGURACIÓN Y CONSTANTES ---
const SECTIONS = {
    OVERVIEW: 'VISTA GENERAL',
    ANALYTICS: 'INTELIGENCIA & PREFERENCIAS',
    OPERATIONS: 'LISTADO MISIONES',
    LOGS: 'AUDITORÍA'
};

const DROPDOWNS = {
    ABANDON_TIMING: ["Inicio (<15m)", "Mitad", "Final"],
    ABANDON_REASON: ["IRL", "Aburrimiento", "Dificultad", "Técnico (Crash/Bug)", "Desconocido"],
    DIFFICULTY: ["Paseo", "Fácil", "Normal", "Difícil", "Hardcore", "Imposible"],
    FLUIDITY: ["Muy Fluida", "Normal", "Lenta/Pesada", "Caótica"],
    TECH_ISSUES: ["Ninguno", "Lag Servidor", "Crashes Puntuales", "Crash Masivo", "Bugs Modset"],
    MISSION_TYPE: ["Recon", "Assault", "Defense", "Convoy", "Stealth", "Logística", "Entrenamiento", "Evento"],
    ZEUS_INTENSITY: ["Baja (Ambiental)", "Media (Reactiva)", "Alta (Constante)", "Total (Micro-management)"],
    ATMOSPHERE: ["Eufórica", "Muy Buena", "Buena", "Tensa", "Tóxica"],
    INTEGRATION: ["Excelente", "Buena", "Normal", "Mala (Aislados)"],
    EVENT_TYPE: ["Operación Standard", "Evento Especial", "Campaña", "Improvisada"],
    COMMS: ["Disciplina Total", "Buena", "Caótica", "Inexistente"],
    BALANCE: ["A favor Jugador", "Equilibrado", "Desafiante", "Injusto/Roto"],
    REPLAYABILITY: ["Alta", "Media", "Baja", "Única (One-off)"]
};

const AVAILABLE_TAGS = ["OFICIAL", "ENTRENAMIENTO", "SIGILO", "CQB", "AEREA", "HARDCORE", "ROLEPLAY", "DEFENSA", "CHECKPOINT", "ARCADE", "VEHICULOS", "ASALTO"];
const COLORS = { primary: "#f59e0b", chart: ["#f59e0b", "#ef4444", "#3b82f6", "#22c55e", "#a855f7"] };
const DELETED_USERS_KEY = "__DELETED_USERS__";
const SYSTEM_LOGS_KEY = "__SYSTEM_LOGS__";

interface AdminProps {
  rawMissions?: any[];
  initialMetadata: any;
  currentUser?: string;
}

interface LogEntry { id: number; date: string; admin: string; action: string; details: string; type: 'INFO'|'WARN'|'DANGER'; }

const EmptyChart = ({ msg, icon: Icon }: { msg: string, icon: any }) => (
    <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2 select-none">
        <Icon size={32} strokeWidth={1.5} />
        <span className="text-[10px] uppercase font-bold tracking-widest">{msg}</span>
    </div>
);

// Tooltip Simplificado
const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-black border border-amber-500/50 p-3 shadow-2xl z-50">
                <p className="text-xs font-black text-white mb-2 uppercase border-b border-white/10 pb-1">{data.name}</p>
                <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between gap-4 text-amber-500">
                        <span>BAJAS TOTALES:</span>
                        <b className="text-white">{data.x}</b>
                    </div>
                    <div className="flex justify-between gap-4 text-blue-400">
                        <span>OPERADORES:</span>
                        <b className="text-white">{data.y}</b>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard({ rawMissions = [], initialMetadata = {}, currentUser = "Unknown" }: AdminProps) {
  const [view, setView] = useState<keyof typeof SECTIONS>('OVERVIEW');
  const [metadata, setMetadata] = useState<any>(initialMetadata || {});
  const [deletedUsers, setDeletedUsers] = useState<string[]>(initialMetadata?.[DELETED_USERS_KEY]?.list || []);
  const [logs, setLogs] = useState<LogEntry[]>(initialMetadata?.[SYSTEM_LOGS_KEY]?.list || []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [trendRange, setTrendRange] = useState<number>(30);

  useEffect(() => {
    if (!isLoaded && initialMetadata) {
        setMetadata(initialMetadata || {});
        if (initialMetadata[DELETED_USERS_KEY]?.list) setDeletedUsers(initialMetadata[DELETED_USERS_KEY].list);
        if (initialMetadata[SYSTEM_LOGS_KEY]?.list) setLogs(initialMetadata[SYSTEM_LOGS_KEY].list);
        setIsLoaded(true);
    }
  }, [initialMetadata]);

  const showNotify = (msg: string, type: 'success'|'error'|'info' = 'info') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const saveToApi = async (key: string, data: any) => {
    try { await fetch('/api/update-metadata', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ missionId: key, data }) }); } catch (e) { console.error(e); }
  };

  const addLog = (action: string, details: string, type: 'INFO'|'WARN'|'DANGER' = 'INFO') => {
      const newLog: LogEntry = { id: Date.now(), date: new Date().toISOString(), admin: currentUser, action, details, type };
      const updatedLogs = [newLog, ...logs].slice(0, 100);
      setLogs(updatedLogs);
      saveToApi(SYSTEM_LOGS_KEY, { list: updatedLogs });
  };

  // --- NÚCLEO MATEMÁTICO ---
  const stats = useMemo(() => {
    const sourceData = (rawMissions && rawMissions.length > 0) ? rawMissions : (localData as any[]);
    
    const missions = sourceData.map((m, idx) => {
        const id = m.id || m.mission || `mission-${idx}`;
        const meta = metadata[id] || {};
        
        const rawPlayers = m.players || m.attendees || [];
        
        const attendees = Array.isArray(rawPlayers) 
            ? rawPlayers.map((p: any) => (typeof p === 'string' ? p : (p?.name || "Unknown")).trim()).filter((n: string) => !deletedUsers.includes(n))
            : [];
            
        let totalMissionKills = 0;
        if (Array.isArray(rawPlayers)) {
            totalMissionKills = rawPlayers.reduce((acc: number, p: any) => {
                if (typeof p === 'object' && p !== null) {
                    return acc + (Number(p.killsTotal) || 0);
                }
                return acc;
            }, 0);
        }

        const date = new Date(meta.customDate || m.date || new Date().toISOString());
        const durationMin = Math.round((m.duration_sec || m.duration || 0) / 60);
        const tags = Array.isArray((meta.tags || m.tags)) ? (meta.tags || m.tags).map((t:any) => String(t).toUpperCase()) : [];

        return {
            ...m, ...meta, id,
            cleanName: (m.name || m.mission || `Op. ${idx}`).replace(/_/g, ' '),
            date: isNaN(date.getTime()) ? new Date() : date, 
            attendees, 
            attendeesCount: attendees.length, 
            durationMin,
            kills: totalMissionKills, 
            rating: Number(meta.rating || 0),
            tags,
            difficulty: meta.difficulty || "Normal",
            abandonReason: meta.abandonReason || "Desconocido",
            abandonCount: Number(meta.abandonCount || 0),
            zeusIntensity: meta.zeusIntensity || "Media (Reactiva)"
        };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Histórico Jugadores
    const playerHistory: Record<string, any> = {};
    missions.forEach((m) => {
        m.attendees.forEach((p: string) => {
            if (!playerHistory[p]) playerHistory[p] = { firstSeen: m.date, lastSeen: m.date, missionCount: 0 };
            playerHistory[p].lastSeen = m.date;
            playerHistory[p].missionCount++;
        });
    });

    const now = new Date();
    const inactiveThreshold = 45 * 24 * 60 * 60 * 1000;
    const redFlagVeterans: any[] = [];
    const redFlagNewbies: any[] = [];

    Object.entries(playerHistory).forEach(([name, data]: any) => {
        const isInactive = (now.getTime() - data.lastSeen.getTime()) > inactiveThreshold;
        if (isInactive) {
            if (data.missionCount >= 5) redFlagVeterans.push({ name, ...data, daysInactive: Math.floor((now.getTime() - data.lastSeen.getTime()) / (1000 * 60 * 60 * 24)) });
            else if (data.missionCount <= 2) redFlagNewbies.push({ name, ...data });
        }
    });

    const scoredMissions = missions.map(m => {
        const score = (m.attendeesCount * 1.5) + (m.rating * 10) - (m.abandonCount * 5);
        return { ...m, score };
    }).sort((a, b) => b.score - a.score);

    const tagPreferences: Record<string, any> = {};
    const difficultyPreferences: Record<string, any> = {};
    const abandonReasons: Record<string, number> = {};
    const zeusStats: Record<string, any> = {};

    missions.forEach(m => {
        m.tags.forEach((t: string) => {
            if (AVAILABLE_TAGS.includes(t)) {
                if (!tagPreferences[t]) tagPreferences[t] = { totalPax: 0, count: 0 };
                tagPreferences[t].totalPax += m.attendeesCount;
                tagPreferences[t].count++;
            }
        });
        const diff = m.difficulty;
        if (!difficultyPreferences[diff]) difficultyPreferences[diff] = { totalPax: 0, count: 0 };
        difficultyPreferences[diff].totalPax += m.attendeesCount;
        difficultyPreferences[diff].count++;
        if (m.abandonCount > 0) abandonReasons[m.abandonReason] = (abandonReasons[m.abandonReason] || 0) + m.abandonCount;
        const z = m.zeusIntensity.split(' ')[0];
        if (!zeusStats[z]) zeusStats[z] = { abandonTotal: 0, missionCount: 0 };
        zeusStats[z].abandonTotal += m.abandonCount;
        zeusStats[z].missionCount++;
    });

    const tagChartData = Object.entries(tagPreferences).map(([n, d]: any) => ({ name: n, avg: Math.round(d.totalPax / d.count) })).sort((a, b) => b.avg - a.avg);
    const difficultyChartData = Object.entries(difficultyPreferences).map(([n, d]: any) => ({ name: n, avg: Math.round(d.totalPax / d.count) })).sort((a, b) => b.avg - a.avg);
    const abandonChartData = Object.entries(abandonReasons).map(([n, v]) => ({ name: n, value: v }));
    const zeusChartData = Object.entries(zeusStats).map(([n, d]: any) => ({ name: n, avgAbandon: parseFloat((d.abandonTotal / d.missionCount).toFixed(1)) })).sort((a, b) => a.avgAbandon - b.avgAbandon);

    const scatterKillsData = missions
        .filter(m => m.attendeesCount > 0) 
        .map(m => ({ 
            x: m.kills, 
            y: m.attendeesCount, 
            z: (m.rating || 3) * 30, 
            name: m.cleanName,
            rating: m.rating
        }));

    const attendanceTrend = missions.map(m => ({ name: m.cleanName, count: m.attendeesCount }));
    const avgAttendance = Math.round(missions.reduce((acc, m) => acc + m.attendeesCount, 0) / (missions.length || 1));
    const activePlayers = Object.values(playerHistory).filter((h:any) => (now.getTime() - h.lastSeen.getTime()) < inactiveThreshold).length;
    
    // --- NUEVO CÁLCULO: % ASISTENCIA ---
    // (Asistencia Media / Jugadores Activos) * 100
    const attendanceRate = activePlayers > 0 ? Math.round((avgAttendance / activePlayers) * 100) : 0;

    return {
        missions, playerHistory, redFlagVeterans, redFlagNewbies, avgAttendance, 
        attendanceRate, // <--- Nueva Propiedad
        scatterKillsData, attendanceTrend, tagChartData, difficultyChartData, abandonChartData, zeusChartData,
        activePlayers, bestMission: scoredMissions[0], worstMission: scoredMissions[scoredMissions.length - 1]
    };
  }, [rawMissions, metadata, deletedUsers]);

  const filteredMissions = stats.missions.filter(m => m.cleanName.toLowerCase().includes(searchTerm.toLowerCase())).reverse();
  const handleManualInput = (field: string, value: any) => { if (selectedMission) setSelectedMission({ ...selectedMission, [field]: value }); };
  const saveMissionData = () => {
      if (!selectedMission) return;
      const { id, rating, difficulty, fluidity, techIssues, abandonCount, abandonReason, tags, customDate, atmosphere, zeusIntensity, comments } = selectedMission;
      const data = { rating, difficulty, fluidity, techIssues, abandonCount, abandonReason, tags, customDate, atmosphere, zeusIntensity, comments };
      setMetadata((p: any) => ({ ...p, [id]: data }));
      saveToApi(id, data);
      addLog("DEBRIEFING_GUARDADO", `Misión: ${selectedMission.cleanName}`, 'INFO');
      showNotify("Datos guardados", "success");
      setSelectedMission(null);
  };

  const trendData = useMemo(() => {
      if (trendRange === 0) return stats.attendanceTrend;
      return stats.attendanceTrend.slice(-trendRange);
  }, [stats.attendanceTrend, trendRange]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono selection:bg-amber-500/30">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10 px-6 py-3 flex justify-between items-center shadow-[0_4px_20px_-10px_rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-3">
              <BrainCircuit className="text-amber-500" size={24}/>
              <div>
                  <h1 className="text-lg font-black uppercase tracking-tighter leading-none text-amber-500">Centro de orientación de operadores</h1>
                  <span className="text-[9px] text-white/40 font-bold tracking-[0.2em] uppercase">Estadísticas  basadas en data recogida por cronjob</span>
              </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded border border-white/10">
              {Object.entries(SECTIONS).map(([key, label]) => (
                  <button key={key} onClick={() => setView(key as keyof typeof SECTIONS)} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${view === key ? 'bg-amber-600 text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                      {label}
                  </button>
              ))}
          </div>
      </header>
      
      {toast && <div className={`fixed bottom-8 right-8 z-50 px-4 py-3 border flex items-center gap-3 animate-in slide-in-from-right bg-black/90 border-amber-500 text-amber-500`}><CheckCircle2 size={16}/><span className="text-xs font-bold">{toast.msg}</span></div>}

      <main className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
        
        {/* === VISTA GENERAL (OVERVIEW) === */}
        {view === 'OVERVIEW' && (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* ATTENDANCE RATE HERO (MODIFICADO) */}
                    <div className="lg:col-span-1 bg-linear-to-br from-amber-900/20 to-black border border-amber-500/20 p-6 flex flex-col items-center justify-center relative group">
                        <div className="absolute top-2 right-2 text-amber-500/20 group-hover:text-amber-500/40 transition-colors"><Activity size={24}/></div>
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90"><circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" /><circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * stats.attendanceRate) / 100} className={`text-amber-500 transition-all duration-1000 shadow-[0_0_20px_#f59e0b]`} /></svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-amber-500">{stats.attendanceRate}%</span>
                                <span className="text-[9px] uppercase tracking-widest opacity-60">Asis. Global Media</span>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard title="Asistencia Media" value={stats.avgAttendance} sub="Operadores / Misión" icon={Users} color="text-amber-400" />
                        <KpiCard title="Jugadores Activos" value={stats.activePlayers} sub="Últimos 45 días" icon={UserCheck} color="text-green-400" />
                        <KpiCard title="Bajas Fidelidad" value={stats.redFlagVeterans.length} sub="Veteranos Inactivos" icon={HeartCrack} color="text-red-500" />
                        <KpiCard title="Total Registrados" value={Object.keys(stats.playerHistory).length} sub="Desde inicio" icon={Fingerprint} color="text-white/40" />
                    </div>
                </div>
                
                {/* BEST/WORST MISSIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stats.bestMission && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-4 relative overflow-hidden">
                            <div className="p-3 bg-amber-500 text-black rounded-full shadow-[0_0_15px_#f59e0b]"><Trophy size={24}/></div>
                            <div><h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest">La Joya de la Corona</h3><p className="text-xl font-black text-white">{stats.bestMission.cleanName}</p><p className="text-[9px] text-white/50">{stats.bestMission.attendeesCount} Ops • Rating {stats.bestMission.rating || '-'}/5 • {stats.bestMission.abandonCount} Abandonos</p></div>
                        </div>
                    )}
                    {stats.worstMission && (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-4 relative overflow-hidden">
                            <div className="p-3 bg-red-500 text-black rounded-full shadow-[0_0_15px_#ef4444]"><Skull size={24}/></div>
                            <div><h3 className="text-[10px] font-black uppercase text-red-500 tracking-widest">Zona de Desastre</h3><p className="text-xl font-black text-white">{stats.worstMission.cleanName}</p><p className="text-[9px] text-white/50">{stats.worstMission.attendeesCount} Ops • Rating {stats.worstMission.rating || '-'}/5 • {stats.worstMission.abandonCount} Abandonos</p></div>
                        </div>
                    )}
                </div>

                {/* ROW 2: RED FLAGS & CORRELATION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-red-900/10 border border-red-500/30 p-6 h-96 overflow-hidden flex flex-col relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><AlertOctagon size={64} className="text-red-500"/></div>
                        <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 text-red-500 tracking-widest"><ShieldAlert size={14}/> RED FLAG: Veteranos Perdidos</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {stats.redFlagVeterans.length > 0 ? (
                                <table className="w-full text-left text-[10px] font-mono">
                                    <thead><tr className="text-red-400/50 uppercase border-b border-red-500/20"><th>Operador</th><th className="text-right">Misiones</th><th className="text-right">Días Inactivo</th></tr></thead>
                                    <tbody className="divide-y divide-red-500/10">
                                        {stats.redFlagVeterans.map((p: any) => (
                                            <tr key={p.name} className="hover:bg-red-500/10 transition-colors"><td className="py-2 font-bold text-red-200">{p.name}</td><td className="py-2 text-right text-red-400">{p.missionCount}</td><td className="py-2 text-right font-black text-red-500">{p.daysInactive}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <div className="h-full flex items-center justify-center text-red-500/50 text-xs">NO HAY ALERTAS DE VETERANOS</div>}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 h-96">
                        <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 text-amber-500"><Swords size={14}/> Correlación: Letalidad vs Asistencia</h3>
                        {stats.scatterKillsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 10}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                    <XAxis type="number" dataKey="x" name="Bajas" stroke="#666" fontSize={10} domain={[0, 'auto']} />
                                    <YAxis type="number" dataKey="y" name="Jugadores" stroke="#666" fontSize={10} domain={[0, 'auto']} />
                                    <ZAxis type="number" dataKey="z" range={[50, 400]} />
                                    <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#fff', strokeWidth: 1 }} />
                                    <Scatter name="Misiones" data={stats.scatterKillsData} fill="#f59e0b" fillOpacity={0.6} shape="circle" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : <EmptyChart msg="No hay datos de kills" icon={Swords} />}
                    </div>
                </div>

                {/* GRAPH TENDENCIA CON FILTROS (FIXED WIDTH ERROR) */}
                <div className="bg-white/5 border border-white/10 p-6 h-96 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-[10px] font-black uppercase flex items-center gap-2 text-white/50"><TrendingUp size={14}/> Evolución Asistencia</h3>
                         <div className="flex bg-black border border-white/10 rounded overflow-hidden">
                             {[5, 10, 15, 20, 30, 50, 0].map(n => (
                                 <button key={n} onClick={() => setTrendRange(n)} className={`px-2 py-1 text-[9px] font-bold border-r border-white/10 last:border-none uppercase ${trendRange === n ? 'bg-amber-600 text-black' : 'text-white/30 hover:text-white'}`}>
                                     {n === 0 ? 'TODAS' : n}
                                 </button>
                             ))}
                         </div>
                    </div>
                    {trendData.length > 0 ? (
                        <div className="flex-1 w-full min-h-0 overflow-x-auto custom-scrollbar">
                            <div style={{ width: `${Math.max(100, trendRange === 0 ? trendData.length * 60 : 100)}%`, minWidth: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs><linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
                                        <XAxis dataKey="name" stroke="#666" fontSize={9} angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
                                        <YAxis stroke="#666" fontSize={10}/>
                                        <Tooltip contentStyle={{background:'#000', border:'1px solid #333', fontSize:'10px'}} />
                                        <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="url(#gAmber)" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : <EmptyChart msg="Sin Misiones" icon={TrendingUp} />}
                </div>
            </>
        )}

        {/* === INTELIGENCIA (ANALYTICS) === */}
        {view === 'ANALYTICS' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* PREFERENCIAS TAGS */}
                 <div className="bg-white/5 border border-white/10 p-6 h-80">
                     <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 text-amber-500"><ThumbsUp size={14}/> Preferencias: Tags (Solo Oficiales)</h3>
                     {stats.tagChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={stats.tagChartData} layout="vertical" margin={{left: 20}}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                                 <XAxis type="number" stroke="#666" fontSize={10} hide />
                                 <YAxis type="category" dataKey="name" stroke="#999" fontSize={9} width={80} />
                                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{background:'#000', border:'1px solid #333', fontSize:'10px'}} />
                                 <Bar dataKey="avg" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                             </BarChart>
                        </ResponsiveContainer>
                     ) : <EmptyChart msg="Falta clasificar misiones (Tags)" icon={List} />}
                 </div>
                 {/* IMPACTO ZEUS */}
                 <div className="bg-white/5 border border-white/10 p-6 h-80">
                     <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 text-red-500"><Zap size={14}/> Efecto Zeus en Abandonos</h3>
                     {stats.zeusChartData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={stats.zeusChartData}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                 <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                 <YAxis stroke="#666" fontSize={10} />
                                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{background:'#000', border:'1px solid #333'}} />
                                 <Legend />
                                 <Bar dataKey="avgAbandon" name="Media Abandonos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                             </BarChart>
                         </ResponsiveContainer>
                     ) : <EmptyChart msg="Falta Info de Zeus" icon={Zap} />}
                 </div>
                 {/* ABANDONOS */}
                 <div className="bg-white/5 border border-white/10 p-6 h-80 flex flex-col">
                     <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 text-white/50"><UserMinus size={14}/> Motivos de Abandono</h3>
                     {stats.abandonChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.abandonChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stats.abandonChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{background:'#000', border:'1px solid #333', fontSize:'10px'}} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{fontSize:'10px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                     ) : <EmptyChart msg="Sin registros de abandono" icon={PieIcon} />}
                 </div>
                 {/* DIFICULTAD */}
                 <div className="bg-white/5 border border-white/10 p-6 h-80">
                     <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 text-amber-500"><Gauge size={14}/> Preferencias: Dificultad</h3>
                     {stats.difficultyChartData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={stats.difficultyChartData}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                 <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                 <YAxis stroke="#666" fontSize={10} />
                                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{background:'#000', border:'1px solid #333'}} />
                                 <Bar dataKey="avg" fill="#eab308" radius={[4, 4, 0, 0]} />
                             </BarChart>
                         </ResponsiveContainer>
                     ) : <EmptyChart msg="Falta Info Dificultad" icon={Gauge} />}
                 </div>
             </div>
        )}

        {/* === LISTADO Y LOGS (MANTENIDOS) === */}
        {view === 'OPERATIONS' && (
             <div className="grid grid-cols-1 gap-4">
                 <div className="bg-white/5 p-3 rounded flex items-center gap-2 border border-white/10">
                     <Search size={16} className="text-white/40"/>
                     <input type="text" placeholder="BUSCAR OPERACIÓN..." className="bg-transparent border-none outline-none text-xs text-white w-full uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {filteredMissions.map((m: any) => (
                         <div key={m.id} onClick={() => setSelectedMission(m)} className="bg-white/5 border border-white/10 p-4 hover:border-amber-500 cursor-pointer transition-all group relative overflow-hidden">
                             <div className={`absolute top-0 left-0 w-1 h-full ${m.rating >= 4 ? 'bg-green-500' : m.rating >= 2 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                             <div className="pl-3">
                                 <div className="flex justify-between items-start mb-2"><h4 className="text-sm font-black uppercase line-clamp-1 group-hover:text-amber-500 transition-colors">{m.cleanName}</h4><span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded">{m.attendeesCount} PAX</span></div>
                                 <div className="flex items-center gap-4 text-[10px] text-white/50 mb-3"><span className="flex items-center gap-1"><Calendar size={10}/> {m.date.toLocaleDateString()}</span><span className="flex items-center gap-1"><Timer size={10}/> {m.durationMin}m</span><span className="flex items-center gap-1"><Swords size={10}/> {m.kills}</span></div>
                                 <div className="flex flex-wrap gap-1">{m.tags && m.tags.slice(0,3).map((t:string) => <span key={t} className="text-[8px] border border-white/10 px-1 rounded uppercase">{t}</span>)}</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {view === 'LOGS' && (
            <div className="bg-white/5 border border-white/10 text-[10px] font-mono min-h-50">
                {logs.length === 0 ? <div className="flex items-center justify-center h-40 text-white/30"><List size={24} className="mb-2 opacity-50"/>SIN REGISTROS</div> : 
                    logs.slice().reverse().map((l) => (
                        <div key={l.id} className="flex border-b border-white/5 p-3 hover:bg-white/5"><span className="w-32 text-white/30">{new Date(l.date).toLocaleString()}</span><span className="w-24 font-bold text-amber-500">{l.admin}</span><span className={`w-32 font-bold ${l.type === 'DANGER' ? 'text-red-500' : 'text-white/60'}`}>{l.action}</span><span className="flex-1 text-white/80">{l.details}</span></div>
                    ))
                }
            </div>
        )}
      </main>

      {/* MODAL (Debriefing) */}
      {selectedMission && (
          <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-[#0a0a0a] border border-amber-500/30 w-full max-w-6xl shadow-[0_0_50px_rgba(245,158,11,0.1)] flex flex-col my-auto max-h-[95vh] animate-in zoom-in-95 duration-200">
                  <div className="bg-amber-600 p-4 flex justify-between items-center text-black sticky top-0 z-20 shadow-xl">
                      <div className="flex items-center gap-4">
                          <FileText size={24}/>
                          <div><h2 className="text-xl font-black uppercase tracking-tighter leading-none">{selectedMission.cleanName}</h2><span className="text-[10px] font-bold uppercase opacity-80 tracking-widest">MISSION DEBRIEFING & ANALYSIS</span></div>
                      </div>
                      <button onClick={() => setSelectedMission(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
                      <div className="lg:col-span-3 bg-black/40 border-r border-white/10 p-6 overflow-y-auto custom-scrollbar space-y-6">
                          <div><h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Métricas Automáticas</h4><div className="space-y-4"><div className="bg-white/5 p-3 border-l-2 border-amber-500"><span className="text-[9px] uppercase text-white/50 block">Asistencia</span><span className="text-2xl font-black">{selectedMission.attendeesCount}</span></div><div className="bg-white/5 p-3 border-l-2 border-red-500"><span className="text-[9px] uppercase text-white/50 block">Bajas Totales</span><span className="text-2xl font-black">{selectedMission.kills}</span></div><div className="bg-white/5 p-3 border-l-2 border-white"><span className="text-[9px] uppercase text-white/50 block">Duración</span><span className="text-2xl font-black">{selectedMission.durationMin}m</span></div></div></div>
                      </div>
                      <div className="lg:col-span-6 p-8 overflow-y-auto custom-scrollbar space-y-8 bg-linear-to-b from-[#0f0f0f] to-black">
                          <section><h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14}/> Experiencia & Calidad</h3><div className="grid grid-cols-2 gap-4 mb-4"><div><label className="input-label">Valoración Global</label><div className="flex gap-1">{[1,2,3,4,5].map(n => (<button key={n} onClick={() => handleManualInput('rating', n)} className={`flex-1 py-2 border text-sm font-bold transition-all ${selectedMission.rating === n ? 'bg-amber-600 border-amber-600 text-black' : 'border-white/10 hover:border-white/30 text-white/30'}`}>{n}</button>))}</div></div><div><label className="input-label">Dificultad</label><select value={selectedMission.difficulty} onChange={e => handleManualInput('difficulty', e.target.value)} className="input-field">{DROPDOWNS.DIFFICULTY.map(o => <option key={o} value={o}>{o}</option>)}</select></div></div><div className="grid grid-cols-2 gap-4"><div><label className="input-label">Fluidez</label><select value={selectedMission.fluidity || "Normal"} onChange={e => handleManualInput('fluidity', e.target.value)} className="input-field">{DROPDOWNS.FLUIDITY.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="input-label">Problemas Técnicos</label><select value={selectedMission.techIssues || "Ninguno"} onChange={e => handleManualInput('techIssues', e.target.value)} className="input-field text-red-400">{DROPDOWNS.TECH_ISSUES.map(o => <option key={o} value={o}>{o}</option>)}</select></div></div></section>
                          <section className="bg-red-500/5 p-4 border border-red-500/10 rounded"><h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2"><UserMinus size={14}/> Informe de Abandonos</h3><div className="flex gap-4 items-end"><div className="w-24"><label className="input-label">Cantidad</label><input type="number" min="0" value={selectedMission.abandonCount || 0} onChange={e => handleManualInput('abandonCount', parseInt(e.target.value))} className="input-field font-mono text-center" /></div><div className="flex-1"><label className="input-label">Causa Principal</label><select value={selectedMission.abandonReason || "Desconocido"} onChange={e => handleManualInput('abandonReason', e.target.value)} className="input-field">{DROPDOWNS.ABANDON_REASON.map(o => <option key={o} value={o}>{o}</option>)}</select></div></div></section>
                          <section><h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> Dinámica Zeus</h3><div className="grid grid-cols-2 gap-4"><div><label className="input-label">Ambiente</label><select value={selectedMission.atmosphere || "Buena"} onChange={e => handleManualInput('atmosphere', e.target.value)} className="input-field">{DROPDOWNS.ATMOSPHERE.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="input-label">Intensidad Zeus</label><select value={selectedMission.zeusIntensity || "Media"} onChange={e => handleManualInput('zeusIntensity', e.target.value)} className="input-field">{DROPDOWNS.ZEUS_INTENSITY.map(o => <option key={o} value={o}>{o}</option>)}</select></div></div><div className="mt-4"><label className="input-label">Notas Staff</label><textarea rows={3} value={selectedMission.comments || ""} onChange={e => handleManualInput('comments', e.target.value)} className="input-field resize-none"></textarea></div></section>
                      </div>
                      <div className="lg:col-span-3 bg-white/2 border-l border-white/10 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                          <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-6">Clasificación</h4>
                          <div className="mb-6"><label className="input-label mb-2">Fecha</label><input type="date" className="input-field" value={selectedMission.customDate ? new Date(selectedMission.customDate).toISOString().split('T')[0] : selectedMission.date.toISOString().split('T')[0]} onChange={e => handleManualInput('customDate', e.target.value)} /></div>
                          <div className="mb-8"><label className="input-label mb-2">Tags</label><div className="flex flex-wrap gap-2">{AVAILABLE_TAGS.map(tag => { const active = (selectedMission.tags || []).includes(tag); return (<button key={tag} onClick={() => { const curr = selectedMission.tags || []; handleManualInput('tags', active ? curr.filter((t:string) => t !== tag) : [...curr, tag]); }} className={`px-2 py-1 text-[9px] font-bold border uppercase transition-all ${active ? 'bg-amber-500 text-black border-amber-500' : 'text-white/30 border-white/10 hover:border-white/50'}`}>{tag}</button>) })}</div></div>
                          <div className="mt-auto pt-6 border-t border-white/10"><button onClick={saveMissionData} className="w-full bg-amber-600 hover:bg-amber-500 text-black py-4 font-black uppercase text-sm tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"><Save size={18}/> Guardar Informe</button></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .input-label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 0.5rem; letter-spacing: 0.05em; }
        .input-field { width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.15); color: white; padding: 0.75rem; font-size: 0.75rem; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #f59e0b; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}

const KpiCard = ({ title, value, sub, icon: Icon, color = "text-white" }: any) => (
  <div className="bg-white/5 border border-white/10 p-4 relative overflow-hidden group hover:border-amber-500/30 transition-all">
      <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}><Icon size={48}/></div>
      <h3 className="text-[10px] font-bold uppercase text-white/40 tracking-widest mb-1">{title}</h3>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className={`text-[9px] font-mono uppercase ${color}`}>{sub}</p>
  </div>
);