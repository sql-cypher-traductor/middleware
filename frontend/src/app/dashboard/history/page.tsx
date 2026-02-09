"use client";

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Header} from "@/components/shared/Header";
import {QueryHistoryTable} from "@/components/history/QueryHistoryTable";
import {authService} from "@/services/authService";
import type {UserResponse} from "@/types/auth";
import {Loader2, ChevronLeft} from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch {
                router.push("/auth");
            } finally {
                setIsLoading(false);
            }
        }

        loadUser();
    }, [router]);

    // Manejar reutilización de consulta - redirigir al dashboard con la consulta
    const handleReuseQuery = (sql: string, cypher: string | null) => {
        // Guardar en sessionStorage para que el dashboard lo recoja
        sessionStorage.setItem(
            "reuseQuery",
            JSON.stringify({sql, cypher})
        );
        router.push("/dashboard");
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader2 className="spinner" size={40}/>
                <p>Cargando...</p>
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        gap: 1rem;
                        color: var(--text-secondary);
                    }

                    .spinner {
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

    if (!user) return null;

    return (
        <div className="history-page">
            <Header user={user}/>
            <main className="history-content">
                <div className="container">
                    <Link href="/dashboard">
                        <div className="back-link">
                            <ChevronLeft size={20}/>
                            <span>Volver al Dashboard</span>
                        </div>
                    </Link>

                    <div className="page-header">
                        <h1 className="page-title">Historial de Consultas</h1>
                        <p className="page-description">
                            Revisa las consultas que has traducido o ejecutado.
                        </p>
                    </div>

                    <QueryHistoryTable onReuseQuery={handleReuseQuery}/>
                </div>
            </main>

            <style jsx>{`
                .history-page {
                    min-height: 100vh;
                    background-color: var(--bg-secondary);
                }

                .history-content {
                    padding: 1.5rem 0;
                }

                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-size: var(--text-label);
                    margin-bottom: 1rem;
                    transition: color 0.15s ease;
                }

                .back-link:hover {
                    color: var(--accent-primary);
                }

                .page-header {
                    margin-bottom: 1.5rem;
                }

                .page-title {
                    font-size: var(--text-h2);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                    margin: 0 0 0.5rem 0;
                }

                .page-description {
                    font-size: var(--text-body);
                    color: var(--text-secondary);
                    margin: 0;
                }
            `}</style>
        </div>
    );
}
