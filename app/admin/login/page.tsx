import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Entrar no painel" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 flex justify-center">
        <Logo width={140} />
      </div>
      <h1 className="mb-6 text-center font-brand text-2xl font-semibold">Painel do salão</h1>
      <Suspense fallback={<Spinner />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
