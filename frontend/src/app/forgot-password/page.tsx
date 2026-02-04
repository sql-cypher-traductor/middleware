"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
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
import { Loader2, ArrowLeft, Mail } from "lucide-react";

const forgotSchema = z.object({
  email: z.email("Ingresa un correo válido"),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotSchema>) {
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", values);
      setIsSent(true);
      toast.success("Correo enviado (Revisa la consola del backend)");
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSent) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Hemos enviado las instrucciones de recuperación."
        sideContent={{
          title: "Seguridad ante todo",
          description:
            "Si no recibes el correo en unos minutos, revisa tu carpeta de spam.",
        }}
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <div className="bg-green-100 p-4 rounded-full">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-center text-sm text-slate-600">
            Hemos enviado un enlace de recuperación a{" "}
            <strong>{form.getValues("email")}</strong>.
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">Volver al inicio de sesión</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar Contraseña"
      subtitle="Ingresa tu email para recibir instrucciones."
      sideContent={{
        title: "¿Problemas para entrar?",
        description:
          "Te ayudaremos a recuperar el acceso a tu cuenta en pocos pasos.",
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
                  <Input placeholder="tu@email.com" {...field} />
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
            Enviar enlace
          </Button>

          <Button variant="link" asChild className="w-full">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver a Login
            </Link>
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
