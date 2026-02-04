"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { useState } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import Link from "next/link";

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      // Validación de credenciales con OAuth2
      const formData = new URLSearchParams();
      formData.append("username", values.email);
      formData.append("password", values.password);

      // Llamada al endpoint para iniciar sesión
      const { data } = await api.post("/auth/login", formData);

      // Almacenamiento de token en local storage
      localStorage.setItem("token", data.access_token);

      toast.success("Bienvenido de nuevo");
      router.push("/dashboard");
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      console.error(error);
      const msg = error.response?.data?.detail || "Credenciales inválidas";
      toast.error("Error de acceso", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle=""
      sideContent={{
        title: "Bienvenido de vuelta",
        description: "",
        ctaText: "¿Aún no tienes una cuenta?",
        ctaLink: "/register",
        ctaLabel: "Regístrate",
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="user@example.com" {...field} />
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
                <div className="flex items-center justify-between">
                  <FormLabel>Contraseña</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
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
            Ingresar
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
