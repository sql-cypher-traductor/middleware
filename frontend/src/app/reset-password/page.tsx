"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

const resetSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof resetSchema>) {
    if (!token) {
      toast.error("Token no válido o faltante");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: token,
        new_password: values.password,
      });
      toast.success("Contraseña actualizada correctamente");
      router.push("/login");
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      const msg =
        err.response?.data?.detail || "El enlace ha expirado o es inválido";
      toast.error("Error", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center text-red-500 py-10">
        Enlace inválido. Asegúrate de copiar el link completo.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cambiar Contraseña
        </Button>
      </form>
    </Form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Nueva Contraseña"
      subtitle="Ingresa tu nueva clave segura."
      sideContent={{
        title: "Casi listo",
        description: "Después de esto podrás ingresar con tu nueva credencial.",
      }}
    >
      <Suspense fallback={<div>Cargando...</div>}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
