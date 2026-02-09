"use client";

import React, {useState, useRef, useEffect} from "react";
import Image from "next/image";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
    ChevronDown,
    Settings,
    History,
    LogOut,
    Shield,

} from "lucide-react";
import {useTheme} from "@/hooks/useTheme";
import {authService} from "@/services/authService";
import type {UserResponse} from "@/types/auth";

interface HeaderProps {
    user: UserResponse;
}

export function Header({user}: HeaderProps) {
    const router = useRouter();
    const {resolvedTheme} = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdmin = user.role === "Administrador";
    const userInitials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.push("/auth");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            // Redirigir de todos modos
            router.push("/auth");
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                {/* Logo y título */}
                <Link href="/dashboard" className="header-brand">
                    <div className="brand-horizontal">
                        <Image
                            src={resolvedTheme === "dark" ? "/logo1.png" : "/logo2.png"}
                            alt="SQL2Graph Logo"
                            width={48}
                            height={48}
                        />
                        <span className="header-title">SQL2Graph</span>
                    </div>
                </Link>

                {/* Avatar y dropdown */}
                <div className="header-user" ref={dropdownRef}>
                    <button
                        className="user-button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                    >
                        <div className="user-avatar">
                            {userInitials}
                        </div>
                        <span className="user-name">{user.first_name}</span>
                        <ChevronDown
                            size={16}
                            className={`chevron ${isDropdownOpen ? "chevron-open" : ""}`}
                        />
                    </button>

                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <div className="dropdown-user-info">
                  <span className="dropdown-user-name">
                    {user.first_name} {user.last_name}
                  </span>
                                    <span className="dropdown-user-email">{user.email}</span>
                                </div>
                            </div>

                            <div className="dropdown-divider"/>

                            <Link
                                href="/dashboard/settings"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <div className="brand-horizontal dropdown-item">
                                    <Settings size={16}/>
                                    <span>Preferencias del sistema</span>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/history"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <div className="brand-horizontal dropdown-item">
                                    <History size={16}/>
                                    <span>Historial de Consultas</span>
                                </div>
                            </Link>

                            {isAdmin && (
                                <>
                                    <div className="dropdown-divider"/>
                                    <Link
                                        href="/admin"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <div className="brand-horizontal dropdown-item">
                                            <Shield size={16}/>
                                            <span>Administración del Sistema</span>
                                        </div>
                                    </Link>
                                </>
                            )}

                            <div className="dropdown-divider"/>

                            <button
                                className="dropdown-item dropdown-item-danger"
                                onClick={handleLogout}
                            >
                                <LogOut size={16}/>
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .header {
                    width: 100%;
                    height: 64px;
                    background-color: var(--bg-primary);
                    border-bottom: 1px solid var(--border-primary);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .header-content {
                    max-width: 1600px;
                    height: 100%;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-brand {
                    align-items: center;
                    color: var(--text-primary);
                    display: flex;
                    text-decoration: none;
                }

                .brand-horizontal {
                    align-items: center;
                    display: flex;
                    flex-direction: row;
                    gap: 0.75rem;
                }

                .header-title {
                    font-size: var(--text-h3);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                }

                .header-user {
                    position: relative;
                }

                .user-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    color: var(--text-primary);
                }

                .user-button:hover {
                    background-color: var(--bg-tertiary);
                    border-color: var(--border-primary);
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--accent-primary), var(--purple-500));
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: var(--text-label);
                    font-weight: var(--font-semibold);
                }

                .user-name {
                    font-size: var(--text-label);
                    font-weight: var(--font-medium);
                    color: var(--text-primary);
                }

                .chevron {
                    color: var(--text-tertiary);
                    transition: transform 0.2s ease;
                }

                .chevron-open {
                    transform: rotate(180deg);
                }

                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    min-width: 240px;
                    background-color: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: 0.75rem;
                    box-shadow: var(--shadow-lg);
                    padding: 0.5rem;
                    animation: fadeIn 0.15s ease;
                    z-index: 1001;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dropdown-header {
                    padding: 0.75rem;
                }

                .dropdown-user-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .dropdown-user-name {
                    font-size: var(--text-label);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                }

                .dropdown-user-email {
                    font-size: var(--text-caption);
                    color: var(--text-muted);
                }

                .dropdown-divider {
                    height: 1px;
                    background-color: var(--border-primary);
                    margin: 0.5rem 0;
                }

                .dropdown-item {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 0.75rem;
                    border-radius: 0.5rem;
                    font-size: var(--text-label);
                    color: var(--text-primary);
                    text-decoration: none;
                    cursor: pointer;
                    transition: background-color 0.15s ease;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                }

                .dropdown-item:hover {
                    background-color: var(--bg-tertiary);
                }

                .dropdown-item-danger {
                    color: var(--error);
                }

                .dropdown-item-danger:hover {
                    background-color: rgba(239, 68, 68, 0.1);
                }

                @media (max-width: 640px) {
                    .user-name {
                        display: none;
                    }
                }
            `}</style>
        </header>
    );
}

export default Header;

