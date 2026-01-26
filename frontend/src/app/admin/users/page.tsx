"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`Usuario ${!user.is_active ? "activado" : "desactivado"}`);
      fetchUsers();
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const toggleAdmin = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { is_superuser: !user.is_superuser });
      toast.success(
        `Privilegios de administrador ${!user.is_superuser ? "otorgados" : "revocados"}`,
      );
      fetchUsers();
    } catch {
      toast.error("Error al actualizar privilegios");
    }
  };

  const deleteUser = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.",
      )
    )
      return;

    try {
      await api.delete(`/users/${id}`);
      toast.success("Usuario eliminado");
      setUsers(users.filter((u) => u.id !== id));
    } catch {
      toast.error("No se pudo eliminar el usuario");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra cuentas, roles y accesos al sistema.
          </p>
        </div>
        <Button onClick={fetchUsers}>Refrescar Lista</Button>
      </div>

      <div className="border rounded-md bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.full_name || "Sin Nombre"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Activo
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_superuser ? (
                      <div className="flex items-center gap-1 text-indigo-600 font-medium text-sm">
                        <Shield className="w-3 h-3" /> Admin
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Usuario</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                        <DropdownMenuItem onClick={() => toggleStatus(user)}>
                          {user.is_active ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-orange-500" />{" "}
                              Desactivar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />{" "}
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => toggleAdmin(user)}>
                          {user.is_superuser ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" /> Quitar
                              Admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4 text-indigo-500" />{" "}
                              Hacer Admin
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
