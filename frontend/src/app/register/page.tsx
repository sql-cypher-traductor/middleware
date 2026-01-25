"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react"; // Icono de carga
import { useState } from "react";

const registerSchema = z.object({
    fullName: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        setIsLoading(true);
        try {
            // AQUÍ IRÁ TU FETCH AL BACKEND
            // const res = await fetch(...)

            // Simulación de éxito
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success("¡Cuenta creada!", { description: "Ya puedes iniciar sesión." });
            router.push("/login");
        } catch (error) {
            toast.error("Error al registrarse", { description: "Inténtalo de nuevo." });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Crear cuenta"
            subtitle="Empieza a traducir SQL a Grafos hoy mismo."
            sideContent={{
                title: "Únete a la revolución Graph",
                description: "Transforma estructuras relacionales rígidas en grafos flexibles. Diseñado para arquitectos de datos modernos.",
                ctaText: "¿Ya tienes cuenta?",
                ctaLink: "/login",
                ctaLabel: "Iniciar Sesión"
            }}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Completo</FormLabel>
                                <FormControl><Input placeholder="Ej. Ana Lovelace" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar</FormLabel>
                                    <FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrarse
                    </Button>
                </form>
            </Form>
        </AuthLayout>
    );
}