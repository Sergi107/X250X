import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, AlertTriangle, Bug, Database } from 'lucide-react';

interface OperatorProps {
    data: any[];
    metadata: any;
}

export default function OperatorFinder({ data, metadata }: OperatorProps) {
    const [search, setSearch] = useState('');
    const [isHydrated, setIsHydrated] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // --- NORMALIZACIÓN DE NOMBRES ---
    // Limpia: "co@12_Operacion_Test.altis" -> "operaciontest"
    const normalizeName = (name: string) => {
        if (!name) return "";
        return name.toLowerCase()
            .replace(/co@\d+_?/g, "") 
            .replace(/_/g, " ")       
            .replace(/\.pbo$/g, "")   
            .replace(/\./g, " ")      
            .replace(/[^a-z0-9]/g, "").trim(); 
    };

    const filteredOperators = useMemo(() => {
        if (!search) return [];
        const lowerSearch = search.toLowerCase();
        return data.filter((op) => op.name.toLowerCase().includes(lowerSearch)).slice(0, 5);
    }, [search, data]);

    const getLastMission = (op: any) => {
        if (!op.stats || !op.stats.history || op.stats.history.length === 0) return null;
        return op.stats.history[op.stats.history.length - 1];
    };

    // --- BÚSQUEDA DE FECHA (CORREGIDO: customDate) ---
    const findDate = (missionName: string, originalDate: string) => {
        if (!missionName) return { date: "N/A", source: "None" };

        const targetClean = normalizeName(missionName);
        let foundDate = null;
        let source = "Auto";

        // 1. Intentar en Metadata
        if (metadata && Object.keys(metadata).length > 0) {
            const metaKeys = Object.keys(metadata);
            
            // A. Búsqueda Exacta
            if (metadata[missionName]?.customDate) { // <--- CORREGIDO AQUI
                foundDate = metadata[missionName].customDate;
                source = "Manual (Exact)";
            } 
            // B. Búsqueda Fuzzy (Nombre limpio)
            else {
                const fuzzyKey = metaKeys.find(k => normalizeName(k) === targetClean || normalizeName(k).includes(targetClean));
                
                // <--- CORREGIDO AQUI: Usamos customDate
                if (fuzzyKey && metadata[fuzzyKey]?.customDate) {
                    foundDate = metadata[fuzzyKey].customDate;
                    source = `Manual (Fuzzy: ${fuzzyKey})`;
                }
            }
        }

        // 2. Fallback Automático (Si no hay manual)
        if (!foundDate && originalDate && originalDate !== "N/A") {
            foundDate = originalDate;
        }

        return { 
            date: foundDate ? new Date(foundDate).toLocaleDateString("es-ES") : "Fecha Desconocida", 
            raw: foundDate,
            source 
        };
    };

    const toggleDebug = (missionName: string) => {
        const info = `
        Misión: "${missionName}"
        Normalizado: "${normalizeName(missionName)}"
        Claves en Metadata: ${metadata ? Object.keys(metadata).length : 0}
        Busqué propiedad: "customDate"
        `;
        setDebugInfo(info);
    };

    if (!isHydrated) return <div className="p-4 border border-white/10 text-white/50 animate-pulse">Cargando buscador...</div>;

    return (
        <div className="bg-black/20 border border-white/10 p-6 rounded-sm w-full">
            <h3 className="text-white font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Search size={18} className="text-pmc-accent" /> Buscador Rápido de Operador
            </h3>
            
            {(!metadata || Object.keys(metadata).length === 0) && (
                <div className="mb-4 text-[10px] bg-red-900/20 text-red-400 p-2 border border-red-900/50 flex items-center gap-2">
                    <Database size={12}/> 
                    ATENCIÓN: No se han cargado metadatos o el archivo está vacío.
                </div>
            )}

            <div className="relative mb-6">
                <input 
                    type="text" 
                    placeholder="Escribe el nombre del operador..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white px-4 py-3 pl-10 focus:border-pmc-accent focus:outline-none transition-colors uppercase tracking-wider text-sm font-mono"
                />
                <Search className="absolute left-3 top-3.5 text-white/30" size={16} />
            </div>

            {/* ZONA DEBUG */}
            {debugInfo && (
                <div className="bg-black border border-white/20 p-2 text-[10px] text-green-400 font-mono mb-4 overflow-x-auto whitespace-pre-wrap relative">
                    <button onClick={() => setDebugInfo(null)} className="absolute top-1 right-2 text-red-500 font-bold">X</button>
                    {debugInfo}
                    <div className="opacity-50 mt-2 border-t border-white/10 pt-2">
                        DUMP PARCIAL JSON:
                        {JSON.stringify(metadata, null, 2).slice(0, 300) + "..."}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {search && filteredOperators.length === 0 && (
                    <div className="text-center p-4 text-white/30 text-xs font-mono uppercase">
                        No se encontraron operadores
                    </div>
                )}

                {filteredOperators.map((op) => {
                    const lastMission = getLastMission(op);
                    const dateInfo = lastMission ? findDate(lastMission.name, lastMission.date) : null;
                    
                    return (
                        <div key={op.id} className="bg-white/5 border border-white/5 hover:border-pmc-accent/30 p-4 transition-all flex flex-col md:flex-row items-center gap-4">
                            
                            {/* INFO */}
                            <div className="flex items-center gap-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 pb-3 md:pb-0">
                                <img src={op.avatar} alt={op.name} className="w-10 h-10 rounded bg-black/50 object-cover" />
                                <div>
                                    <p className="text-pmc-accent font-bold text-sm uppercase leading-none">{op.name}</p>
                                    <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">{op.rank}</p>
                                </div>
                            </div>

                            {/* ASISTENCIA */}
                            <div className="flex flex-col items-center justify-center w-full md:w-1/4 border-b md:border-b-0 md:border-r border-white/5 pb-3 md:pb-0">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Asistencia</span>
                                <span className={`text-xl font-black ${op.attendanceColor}`}>{op.attendance}</span>
                            </div>

                            {/* ÚLTIMA MISIÓN */}
                            <div className="w-full md:w-auto grow flex flex-col justify-center pl-0 md:pl-4">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Última Misión</span>
                                {lastMission ? (
                                    <div className="flex flex-col group relative">
                                        <span className="text-white font-bold text-xs truncate w-full md:max-w-62.5" title={lastMission.name}>
                                            {lastMission.name}
                                        </span>
                                        
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-mono flex items-center gap-1 font-bold ${dateInfo?.date === 'Fecha Desconocida' ? 'text-red-500' : 'text-pmc-accent'}`}>
                                                <Calendar size={10} /> 
                                                {dateInfo?.date}
                                            </span>
                                            {/* Debug Button */}
                                            <button onClick={() => toggleDebug(lastMission.name)} className="text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Bug size={10} />
                                            </button>
                                        </div>
                                        <span className="text-[8px] text-white/20">
                                            Fuente: {dateInfo?.source}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-red-400 text-xs font-mono flex items-center gap-2">
                                        <AlertTriangle size={12} /> Sin historial
                                    </span>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}