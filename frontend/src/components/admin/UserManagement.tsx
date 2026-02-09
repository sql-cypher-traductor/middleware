"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  MoreVertical,
  UserCog,
  UserX,
  UserCheck,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { adminService, type AdminUser, type UsersListResponse } from "@/services/adminService";
import { ApiError } from "@/services/api";

// Badge de rol con colores
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "Administrador";
  return (
    <span className={`role-badge ${isAdmin ? "admin" : "developer"}`}>
      {role}
      <style jsx>{`
        .role-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: var(--text-caption);
          font-weight: var(--font-semibold);
        }
        .role-badge.admin {
          background-color: rgba(168, 85, 247, 0.15);
          color: var(--purple-500);
        }
        .role-badge.developer {
          background-color: rgba(6, 182, 212, 0.15);
          color: var(--accent-primary);
        }
      `}</style>
    </span>
  );
}

// Badge de estado
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`status-badge ${isActive ? "active" : "inactive"}`}>
      {isActive ? "Activo" : "Inactivo"}
      <style jsx>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
        }
        .status-badge.active {
          background-color: rgba(34, 197, 94, 0.15);
          color: var(--success);
        }
        .status-badge.inactive {
          background-color: rgba(239, 68, 68, 0.15);
          color: var(--error);
        }
      `}</style>
    </span>
  );
}

// Modal de confirmación
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant?: "danger" | "warning";
  isLoading?: boolean;
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="modal-icon">
          <AlertTriangle size={32} />
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className={`btn ${confirmVariant === "danger" ? "btn-danger" : "btn-warning"}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={16} className="spinner" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.75rem;
          padding: 1.5rem;
          max-width: 400px;
          width: 100%;
          text-align: center;
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
        }
        .modal-close:hover { color: var(--text-primary); }
        .modal-icon {
          color: var(--warning);
          margin-bottom: 1rem;
        }
        .modal-title {
          font-size: var(--text-body);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .modal-message {
          font-size: var(--text-label);
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }
        .btn-secondary {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .btn-secondary:hover { background-color: var(--border-primary); }
        .btn-danger {
          background-color: var(--error);
          color: white;
        }
        .btn-danger:hover { opacity: 0.9; }
        .btn-warning {
          background-color: var(--warning);
          color: white;
        }
        .btn-warning:hover { opacity: 0.9; }
        .btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Dropdown de acciones
interface ActionDropdownProps {
  user: AdminUser;
  onChangeRole: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isCurrentUser: boolean;
}

function ActionDropdown({ user, onChangeRole, onToggleStatus, onDelete, isCurrentUser }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown-container">
      <button className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div className="dropdown-menu">
            <button
              className="dropdown-item"
              onClick={() => { onChangeRole(); setIsOpen(false); }}
              disabled={isCurrentUser}
            >
              <UserCog size={16} />
              <span>Cambiar rol</span>
            </button>
            <button
              className="dropdown-item"
              onClick={() => { onToggleStatus(); setIsOpen(false); }}
              disabled={isCurrentUser}
            >
              {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
              <span>{user.is_active ? "Desactivar cuenta" : "Activar cuenta"}</span>
            </button>
            <div className="dropdown-divider" />
            <button
              className="dropdown-item danger"
              onClick={() => { onDelete(); setIsOpen(false); }}
              disabled={isCurrentUser}
            >
              <Trash2 size={16} />
              <span>Eliminar usuario</span>
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .dropdown-container { position: relative; }
        .dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dropdown-trigger:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.25rem;
          min-width: 180px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          box-shadow: var(--shadow-lg);
          padding: 0.375rem;
          z-index: 20;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: var(--text-label);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background-color 0.15s ease;
          text-align: left;
        }
        .dropdown-item:hover:not(:disabled) { background-color: var(--bg-tertiary); }
        .dropdown-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dropdown-item.danger { color: var(--error); }
        .dropdown-item.danger:hover:not(:disabled) { background-color: rgba(239, 68, 68, 0.1); }
        .dropdown-divider {
          height: 1px;
          background-color: var(--border-primary);
          margin: 0.375rem 0;
        }
      `}</style>
    </div>
  );
}

export function UserManagement() {
  const [usersData, setUsersData] = useState<UsersListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados para modales
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "toggle-status" | "change-role";
    user: AdminUser | null;
  }>({ isOpen: false, type: "delete", user: null });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers({
        search: searchQuery || undefined,
        role: roleFilter || undefined,
        page: currentPage,
        page_size: 10,
      });
      setUsersData(data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail);
      } else {
        toast.error("Error al cargar usuarios");
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleChangeRole = async () => {
    if (!confirmModal.user) return;
    setActionLoading(true);
    try {
      const newRole = confirmModal.user.role === "Administrador" ? "Desarrollador" : "Administrador";
      await adminService.updateUser(confirmModal.user.user_id, { role: newRole as "Desarrollador" | "Administrador" });
      toast.success(`Rol cambiado a ${newRole}`);
      loadUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail);
      } else {
        toast.error("Error al cambiar el rol");
      }
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false, type: "delete", user: null });
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmModal.user) return;
    setActionLoading(true);
    try {
      const newStatus = !confirmModal.user.is_active;
      await adminService.updateUser(confirmModal.user.user_id, { is_active: newStatus });
      toast.success(`Usuario ${newStatus ? "activado" : "desactivado"}`);
      loadUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail);
      } else {
        toast.error("Error al cambiar el estado");
      }
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false, type: "delete", user: null });
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.user) return;
    setActionLoading(true);
    try {
      await adminService.deleteUser(confirmModal.user.user_id);
      toast.success("Usuario eliminado");
      loadUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail);
      } else {
        toast.error("Error al eliminar usuario");
      }
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false, type: "delete", user: null });
    }
  };

  const getModalConfig = () => {
    if (!confirmModal.user) return { title: "", message: "", confirmText: "", onConfirm: () => {} };

    switch (confirmModal.type) {
      case "change-role":
        const newRole = confirmModal.user.role === "Administrador" ? "Desarrollador" : "Administrador";
        return {
          title: "Cambiar rol de usuario",
          message: `¿Estás seguro de cambiar el rol de "${confirmModal.user.first_name} ${confirmModal.user.last_name}" a ${newRole}?`,
          confirmText: "Cambiar rol",
          onConfirm: handleChangeRole,
          variant: "warning" as const,
        };
      case "toggle-status":
        const action = confirmModal.user.is_active ? "desactivar" : "activar";
        return {
          title: `${confirmModal.user.is_active ? "Desactivar" : "Activar"} cuenta`,
          message: `¿Estás seguro de ${action} la cuenta de "${confirmModal.user.first_name} ${confirmModal.user.last_name}"?`,
          confirmText: confirmModal.user.is_active ? "Desactivar" : "Activar",
          onConfirm: handleToggleStatus,
          variant: "warning" as const,
        };
      case "delete":
        return {
          title: "Eliminar usuario",
          message: `¿Estás seguro de eliminar a "${confirmModal.user.first_name} ${confirmModal.user.last_name}"? Esta acción no se puede deshacer.`,
          confirmText: "Eliminar",
          onConfirm: handleDelete,
          variant: "danger" as const,
        };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <div className="user-management">
      <div className="section-header">
        <h3 className="section-title">Gestión de Usuarios</h3>
        <p className="section-description">Administra usuarios, roles y permisos del sistema.</p>
      </div>

      {/* Filtros */}
      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search size={48} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="role-filter"
            >
              <option value="">Todos los roles</option>
              <option value="Desarrollador">Desarrollador</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
        </form>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="spinner" />
          <p>Cargando usuarios...</p>
        </div>
      ) : usersData && usersData.users.length > 0 ? (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersData.users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="user-name">
                      <div className="user-avatar">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <span>{user.first_name} {user.last_name}</span>
                    </td>
                    <td className="user-email">{user.email}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td><StatusBadge isActive={user.is_active} /></td>
                    <td>
                      <ActionDropdown
                        user={user}
                        onChangeRole={() => setConfirmModal({ isOpen: true, type: "change-role", user })}
                        onToggleStatus={() => setConfirmModal({ isOpen: true, type: "toggle-status", user })}
                        onDelete={() => setConfirmModal({ isOpen: true, type: "delete", user })}
                        isCurrentUser={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {usersData.total_pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando {((currentPage - 1) * usersData.page_size) + 1} - {Math.min(currentPage * usersData.page_size, usersData.total)} de {usersData.total}
              </span>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="pagination-current">
                  Página {currentPage} de {usersData.total_pages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === usersData.total_pages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p>No se encontraron usuarios</p>
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "delete", user: null })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmVariant={modalConfig.variant}
        isLoading={actionLoading}
      />

      <style jsx>{`
        .user-management { }
        .section-header { margin-bottom: 1.5rem; }
        .section-title { font-size: var(--text-h3); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.25rem; }
        .section-description { font-size: var(--text-label); color: var(--text-secondary); }

        .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .search-form { flex: 1; min-width: 200px; }
        .search-input-wrapper { position: relative; display: flex; align-items: center; gap: 1rem }
        .search-icon { position: absolute; left: 1rem; color: var(--text-muted); pointer-events: none; }
        .search-input {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: var(--text-label);
        }
        .search-input:focus { outline: none; border-color: var(--accent-primary); }
        .role-filter {
          padding: 0.625rem 1.125rem;
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: var(--text-label);
          min-width: 160px;
        }

        .table-container { overflow-x: auto; }
        .users-table { width: 100%; border-collapse: collapse; }
        .users-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: var(--text-caption);
          font-weight: var(--font-semibold);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-primary);
        }
        .users-table td {
          padding: 0.875rem 1rem;
          font-size: var(--text-label);
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-primary);
        }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover { background-color: var(--bg-tertiary); }

        .user-name { display: flex; align-items: center; gap: 0.75rem; font-weight: var(--font-medium); }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--purple-500));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-caption);
          font-weight: var(--font-semibold);
        }
        .user-email { color: var(--text-secondary); }

        .pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-primary); flex-wrap: wrap; gap: 1rem; }
        .pagination-info { font-size: var(--text-caption); color: var(--text-muted); }
        .pagination-controls { display: flex; align-items: center; gap: 0.5rem; }
        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pagination-btn:hover:not(:disabled) { background-color: var(--bg-tertiary); }
        .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pagination-current { font-size: var(--text-label); color: var(--text-secondary); padding: 0 0.5rem; }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--text-muted);
          gap: 0.75rem;
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default UserManagement;




