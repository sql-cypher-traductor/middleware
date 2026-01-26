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
  Plug,
  Code2,
  ArrowRight,
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
import { DbConnection } from "@/types/db-connection";

export default function DashboardPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConn, setSelectedConn] = useState<DbConnection | undefined>(
    undefined,
  );
  const [userName] = useState("Usuario"); // Estado para el nombre

  // Cargar conexiones y datos de usuario
  const fetchConnections = async () => {
    try {
      const res = await api.get("/connections");
      setConnections(res.data);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchConnections();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    toast.promise(api.delete(`/connections/${id}`), {
      loading: "Eliminando...",
      success: () => {
        fetchConnections();
        return "Conexión eliminada";
      },
      error: "No se pudo eliminar la conexión",
    });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* NAVBAR */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-linear-to-tr from-indigo-600 to-purple-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Database className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              SQL2Graph
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-muted-foreground">
              {/* Aquí iría el email del usuario si lo tuviéramos en estado */}
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
            <Avatar className="h-9 w-9 border-2 border-indigo-100 dark:border-indigo-900">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
              />
              <AvatarFallback>US</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-500">
        {/* Header de la Sección */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Mis Conexiones
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestiona tus credenciales de SQL Server y Neo4j de forma segura.
            </p>
          </div>
          <Button
            onClick={openNewModal}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Conexión
          </Button>
          <Button
              onClick={() => router.push('/translate')}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            Ir al Traductor <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Tabla de Conexiones */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-500" />
              Bóveda de Credenciales
            </CardTitle>
            <CardDescription>
              Tus contraseñas están cifradas con AES-256. Solo tú puedes
              usarlas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                <p className="text-muted-foreground text-sm">
                  Cargando tus llaves...
                </p>
              </div>
            ) : connections.length === 0 ? (
              // EMPTY STATE MEJORADO
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                  <Plug className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  No hay conexiones aún
                </h3>
                <p className="text-slate-500 max-w-sm mt-2 mb-6">
                  Conecta tu primera base de datos para empezar a traducir
                  consultas.
                </p>
                <Button
                  onClick={openNewModal}
                  variant="outline"
                  className="border-dashed border-2"
                >
                  Crear primera conexión
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="pl-6">Alias</TableHead>
                    <TableHead>Motor</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((conn) => (
                    <TableRow
                      key={conn.id}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <TableCell className="pl-6 font-medium flex items-center gap-3 py-4">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg ${conn.engine === "neo4j" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}
                        >
                          <Database className="h-4 w-4" />
                        </div>
                        <span className="text-base">{conn.alias}</span>
                      </TableCell>
                      <TableCell className="capitalize">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conn.engine === "neo4j" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"}`}
                        >
                          {conn.engine}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {conn.host}:{conn.port}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {conn.username}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditModal(conn)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4 text-indigo-500" />
                              Editar / Probar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(conn.id)}
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
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

      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchConnections}
        connectionToEdit={selectedConn}
      />
    </div>
  );
}
