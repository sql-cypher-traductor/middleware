"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Database,
  LogOut,
  Trash2,
  Edit,
  Server,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectionModal } from "@/components/dashboard/connection-modal";

// Tipo de dato para la conexión
interface DbConnection {
  id: string;
  alias: string;
  engine: string;
  host: string;
  username: string;
  port: string;
  db_name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConn, setSelectedConn] = useState<DbConnection | undefined>(
    undefined,
  );

  // 1. Cargar datos al inicio
  const fetchConnections = async () => {
    try {
      const res = await api.get("/connections");
      setConnections(res.data);
    } catch (error) {
      toast.error("Error cargando conexiones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Validación de token
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
    else fetchConnections();
  }, [router]);

  // 2. Funciones de acción
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta conexión?")) return;
    try {
      await api.delete(`/connections/${id}`);
      toast.success("Conexión eliminada");
      await fetchConnections();
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  const openNewModal = () => {
    setSelectedConn(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (conn: DbConnection) => {
    setSelectedConn(conn);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* NAVBAR */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-cyan-500">
              SQL2Graph
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header de la Sección */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Mis Conexiones
            </h2>
            <p className="text-muted-foreground">
              Gestiona tus credenciales de SQL Server y Neo4j.
            </p>
          </div>
          <Button
            onClick={openNewModal}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Conexión
          </Button>
        </div>

        {/* Tabla de Conexiones */}
        <Card>
          <CardHeader>
            <CardTitle>Bóveda de Credenciales</CardTitle>
            <CardDescription>
              Tus contraseñas están cifradas con AES-256 y nunca son visibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10">Cargando...</div>
            ) : connections.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Server className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No tienes conexiones configuradas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alias</TableHead>
                    <TableHead>Motor</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((conn) => (
                    <TableRow key={conn.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${conn.engine === "neo4j" ? "bg-green-500" : "bg-blue-500"}`}
                        />
                        {conn.alias}
                      </TableCell>
                      <TableCell className="capitalize">
                        {conn.engine}
                      </TableCell>
                      <TableCell>
                        {conn.host}:{conn.port}
                      </TableCell>
                      <TableCell>{conn.username}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            {/* AQUÍ ESTABA EL ERROR: Faltaba cerrar el Button */}
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditModal(conn)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Editar / Probar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(conn.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* MODAL */}
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchConnections}
        connectionToEdit={selectedConn}
      />
    </div>
  );
}
