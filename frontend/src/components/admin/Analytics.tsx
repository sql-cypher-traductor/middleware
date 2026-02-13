"use client";

import React, {useState, useEffect} from "react";
import {
    Users,
    Database,
    Clock,
    AlertCircle,
    TrendingUp,
    Loader2,
    RefreshCw,
    Activity,
    Zap,
    CheckCircle,
    XCircle,
    Link2,
    Calendar,
} from "lucide-react";
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
} from "recharts";
import {adminService} from "@/services/adminService";
import type {UsageStatsResponse} from "@/types/logs";
import {toast} from "sonner";

export function Analytics() {
    const [stats, setStats] = useState<UsageStatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            try {
                const response = await adminService.getUsageStats(days);
                setStats(response);
            } catch (error) {
                console.error("Error al cargar estadísticas:", error);
                toast.error("Error al cargar las estadísticas de uso");
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, [days]);

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const response = await adminService.getUsageStats(days);
            setStats(response);
            toast.success("Estadísticas actualizadas");
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
            toast.error("Error al cargar las estadísticas");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="loading-state">
                <Loader2 size={32} className="spinning"/>
                <p>Cargando estadísticas de uso...</p>
                <style jsx>{`
                    .loading-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 4rem 2rem;
                        color: var(--text-muted);
                        gap: 1rem;
                    }

                    :global(.spinning) {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="error-state">
                <AlertCircle size={48}/>
                <p>No se pudieron cargar las estadísticas</p>
                <button onClick={handleRefresh}>Reintentar</button>
                <style jsx>{`
                    .error-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 4rem 2rem;
                        color: var(--text-muted);
                        gap: 1rem;
                    }

                    .error-state button {
                        padding: 0.5rem 1rem;
                        background: var(--accent-primary);
                        color: white;
                        border: none;
                        border-radius: 0.375rem;
                        cursor: pointer;
                    }
                `}</style>
            </div>
        );
    }

    const {stats: usageStats, queries_by_day, query_status_distribution} = stats;

    // Preparar datos para el gráfico de área (tendencia de consultas)
    const areaChartData = queries_by_day.map((item) => ({
        date: new Date(item.date).toLocaleDateString("es-ES", {day: "2-digit", month: "short"}),
        total: item.total,
        traducidas: item.translated,
        ejecutadas: item.executed,
        fallidas: item.failed,
    }));

    // Preparar datos para el gráfico de pie (distribución de estados)
    const pieChartData = query_status_distribution.filter(item => item.count > 0);

    return (
        <div className="analytics">
            <div className="analytics-header">
                <div className="header-info">
                    <h3 className="section-title">Estadísticas de Uso</h3>
                </div>
                <div className="header-controls">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="period-select"
                    >
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={90}>Últimos 90 días</option>
                        <option value={365}>Último año</option>
                    </select>
                    <button className="refresh-btn" onClick={handleRefresh} title="Actualizar">
                        <RefreshCw size={16}/>
                    </button>
                </div>
            </div>

            {/* Gráficos */}
            <div className="charts-grid">
                {/* Gráfico de área - Tendencia de consultas por día */}
                <div className="chart-card chart-large">
                    <h4 className="chart-title">
                        <Activity size={18}/>
                        Consultas por Día (Tendencia)
                    </h4>
                    <div className="chart-container">
                        {areaChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={areaChartData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)"/>
                                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11}/>
                                    <YAxis stroke="var(--text-muted)" fontSize={11}/>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--bg-secondary)",
                                            border: "1px solid var(--border-primary)",
                                            borderRadius: "0.5rem",
                                        }}
                                    />
                                    <Legend/>
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                        name="Total"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="traducidas"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Traducidas"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ejecutadas"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Ejecutadas"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="fallidas"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Fallidas"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">
                                <Database size={32}/>
                                <p>No hay datos de consultas para mostrar</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de pie - Distribución por estado */}
                <div className="chart-card">
                    <h4 className="chart-title">
                        <CheckCircle size={18}/>
                        Distribución por Estado
                    </h4>
                    <div className="chart-container">
                        {pieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={3}
                                        dataKey="count"
                                        nameKey="status"
                                        label={({percent}) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color}/>
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--bg-secondary)",
                                            border: "1px solid var(--border-primary)",
                                            borderRadius: "0.5rem",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">
                                <XCircle size={32}/>
                                <p>Sin datos de distribución</p>
                            </div>
                        )}
                    </div>
                    {/* Leyenda personalizada */}
                    <div className="pie-legend">
                        {query_status_distribution.map((item) => (
                            <div key={item.status} className="legend-item">
                                <span className="legend-color" style={{backgroundColor: item.color}}></span>
                                <span className="legend-label">{item.status}</span>
                                <span className="legend-value">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cards de resumen - Usuarios */}
            <div className="section-label">
                <Users size={16}/>
                <span>Usuarios</span>
            </div>
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon users">
                        <Users size={48}/>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usageStats.total_users}</span>
                        <span className="stat-label">Usuarios Totales</span>
                        <span className="stat-sub">{usageStats.active_users} activos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon today">
                        <Calendar size={48}/>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usageStats.users_logged_in_today}</span>
                        <span className="stat-label">Conectados Hoy</span>
                        <span className="stat-sub">{usageStats.new_users_this_week} nuevos esta semana</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon connections">
                        <Link2 size={48}/>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usageStats.total_connections}</span>
                        <span className="stat-label">Conexiones BD</span>
                        <span className="stat-sub">{usageStats.active_connections} activas</span>
                    </div>
                </div>
            </div>

            {/* Cards de resumen - Consultas */}
            <div className="section-label">
                <Database size={16}/>
                <span>Consultas</span>
            </div>
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon queries">
                        <Database size={48}/>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usageStats.total_queries}</span>
                        <span className="stat-label">Consultas Totales</span>
                        <span className="stat-sub">{usageStats.queries_today} hoy • {usageStats.queries_this_week} esta semana</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <TrendingUp size={24}/>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usageStats.success_rate}%</span>
                        <span className="stat-label">Tasa de Éxito</span>
                        <span className="stat-sub">
              {usageStats.translated_queries + usageStats.executed_queries} exitosas / {usageStats.failed_queries} fallidas
            </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon translated">
                        <CheckCircle size={24}/>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usageStats.translated_queries}</span>
                        <span className="stat-label">Solo Traducidas</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon executed">
                        <Zap size={24}/>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{usageStats.executed_queries}</span>
                        <span className="stat-label">Ejecutadas</span>
                    </div>
                </div>
            </div>

            {/* Cards de resumen - Rendimiento */}
            <div className="section-label">
                <Clock size={16}/>
                <span>Rendimiento</span>
            </div>
            <div className="stats-cards performance-cards">
                <div className="stat-card wide">
                    <div className="stat-icon time">
                        <Clock size={24}/>
                    </div>
                    <div className="stat-info">
            <span className="stat-value">
              {usageStats.avg_translation_time_ms
                  ? `${usageStats.avg_translation_time_ms.toFixed(2)} ms`
                  : "N/A"}
            </span>
                        <span className="stat-label">Tiempo Promedio de Traducción</span>
                    </div>
                </div>

                <div className="stat-card wide">
                    <div className="stat-icon execution">
                        <Activity size={24}/>
                    </div>
                    <div className="stat-info">
            <span className="stat-value">
              {usageStats.avg_execution_time_ms
                  ? `${usageStats.avg_execution_time_ms.toFixed(2)} ms`
                  : "N/A"}
            </span>
                        <span className="stat-label">Tiempo Promedio de Ejecución</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .analytics {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .section-title {
                    font-size: var(--text-h3);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                    margin: 0 0 0.25rem 0;
                }

                .header-controls {
                    display: flex;
                    gap: 0.5rem;
                }

                .period-select {
                    padding: 0.5rem 0.75rem;
                    background-color: var(--bg-tertiary);
                    border: 1px solid var(--border-primary);
                    border-radius: 0.375rem;
                    color: var(--text-primary);
                    font-size: var(--text-caption);
                    cursor: pointer;
                }

                .refresh-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 0.375rem;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .refresh-btn:hover {
                    color: var(--accent-primary);
                }

                .section-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: var(--text-caption);
                    font-weight: var(--font-semibold);
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 0.5rem;
                }

                .stats-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 0.75rem;
                }

                .performance-cards {
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background-color: var(--bg-tertiary);
                    border: 1px solid var(--border-primary);
                    border-radius: 0.5rem;
                }

                .stat-card.wide {
                    min-width: 250px;
                }

                .stat-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    border-radius: 0.5rem;
                    flex-shrink: 0;
                }

                .stat-icon.users {
                    color: #8b5cf6;
                }

                .stat-icon.today {
                    color: #06b6d4;
                }

                .stat-icon.connections {
                    color: #a855f7;
                }

                .stat-icon.queries {
                    color: #3b82f6;
                }

                .stat-icon.success {
                    color: #22c55e;
                }

                .stat-icon.translated {
                    color: #3b82f6;
                }

                .stat-icon.executed {
                    color: #22c55e;
                }

                .stat-icon.time {
                    color: #f59e0b;
                }

                .stat-icon.execution {
                    color: #ec4899;
                }

                .stat-info {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .stat-value {
                    font-size: 1.25rem;
                    font-weight: var(--font-bold);
                    color: var(--text-primary);
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    white-space: nowrap;
                }

                .stat-sub {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    margin-top: 0.125rem;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }

                .chart-card {
                    background-color: var(--bg-tertiary);
                    border: 1px solid var(--border-primary);
                    border-radius: 0.5rem;
                    padding: 1rem;
                }

                .chart-large {
                }

                .chart-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: var(--text-body);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                    margin: 0 0 0.75rem 0;
                }

                .chart-container {
                    width: 100%;
                }

                .no-data {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--text-muted);
                    gap: 0.5rem;
                }

                .no-data p {
                    margin: 0;
                    font-size: var(--text-caption);
                }

                .pie-legend {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border-primary);
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                }

                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                    flex-shrink: 0;
                }

                .legend-label {
                    flex: 1;
                    color: var(--text-secondary);
                }

                .legend-value {
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                }

                @media (max-width: 900px) {
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }

                    .stats-cards {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 600px) {
                    .stats-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default Analytics;

