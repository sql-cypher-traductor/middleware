"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DbConnection } from "@/types/db-connection";
import { AxiosError } from "axios";

// Esquema de validación
const connectionSchema = z.object({
  alias: z.string().min(3, "Dale un nombre reconocible (ej. Prod Ventas)"),
  engine: z.string().min(1, "Selecciona un motor"),
  host: z.string().min(1, "Requerido (ej. localhost o IP)"),
  port: z.string().min(1, "Requerido"),
  username: z.string().min(1, "Usuario requerido"),
  password: z.string().optional(), // Opcional al editar
  db_name: z.string().optional(),
});

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  connectionToEdit?: DbConnection;
}

export function ConnectionModal({
  isOpen,
  onClose,
  onSuccess,
  connectionToEdit,
}: ConnectionModalProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof connectionSchema>>({
    resolver: zodResolver(connectionSchema),
    defaultValues: connectionToEdit || {
      alias: "",
      engine: "sqlserver",
      host: "localhost",
      port: "1433",
      username: "sa",
      password: "",
      db_name: "",
    },
  });

  // Resetear form al cambiar de modo (Crear <-> Editar)

  async function onTestConnection() {
    setIsTesting(true);
    try {
      if (!connectionToEdit?.id) {
        toast.warning("Primero guarda la conexión para probarla.");
        return;
      }

      const res = await api.post(`/connections/${connectionToEdit.id}/test`);
      toast.success(res.data.message);
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      const msg = error.response?.data?.detail || "Error desconocido";
      toast.error("Fallo de conexión", { description: msg });
    } finally {
      setIsTesting(false);
    }
  }

  async function onSubmit(values: z.infer<typeof connectionSchema>) {
    setIsSaving(true);
    try {
      if (connectionToEdit) {
        // MODO EDICIÓN
        await api.put(`/connections/${connectionToEdit.id}`, values);
        toast.success("Conexión actualizada");
      } else {
        // MODO CREACIÓN
        if (!values.password) {
          toast.error("La contraseña es obligatoria para nuevas conexiones");
          setIsSaving(false);
          return;
        }
        await api.post("/connections", values);
        toast.success("Conexión guardada exitosamente");
      }
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      const msg = error.response?.data?.detail || "Error al guardar";
      toast.error("Error", { description: msg });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {connectionToEdit ? "Editar Conexión" : "Nueva Conexión"}
          </DialogTitle>
          <DialogDescription>
            Ingresa las credenciales de tu base de datos. Se guardarán cifradas
            (AES-256).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias (Nombre amigable)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. SQL Server Local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="engine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona motor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sqlserver">
                          SQL Server (T-SQL)
                        </SelectItem>
                        <SelectItem value="neo4j">Neo4j (Cypher)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puerto</FormLabel>
                    <FormControl>
                      <Input placeholder="1433" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host / Servidor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="localhost o host.docker.internal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="sa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={
                          connectionToEdit ? "(Sin cambios)" : "******"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="db_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base de Datos (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="master" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between sm:justify-between w-full">
              {connectionToEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Test Conexión
                </Button>
              )}

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {connectionToEdit ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
