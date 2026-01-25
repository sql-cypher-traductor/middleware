"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
            // PREPARACIÓN PARA TU BACKEND (FastAPI OAuth2)
            const formData = new URLSearchParams();
            formData.append('username', values.email);
            formData.append('password', values.password);

            // const res = await fetch("http://localhost:8000/api/v1/auth/login", { ... })

            // Simulación
            await new Promise(resolve => setTimeout(resolve, 1000));

            // localStorage.setItem("token", data.access_token);
            toast.success("Bienvenido de nuevo");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Credenciales inválidas");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Iniciar Sesión"
            subtitle="Accede a tus proyectos y conexiones."
            sideContent={{
                title: "Bienvenido de vuelta",
                description: "Continúa optimizando tus consultas y gestionando tus bases de datos desde un solo lugar.",
                ctaText: "¿No tienes cuenta?",
                ctaLink: "/register",
                ctaLabel: "Regístrate gratis"
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
                                <FormControl><Input placeholder="nombre@empresa.com" {...field} /></FormControl>
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
                                <FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ingresar
                    </Button>
                </form>
            </Form>
        </AuthLayout>
    );
}