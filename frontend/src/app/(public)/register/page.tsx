import { AuthForm } from "@/components/AuthForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 md:py-12">
      <AuthForm initialTab="daftar" redirectTo={redirect || "/"} />
    </main>
  );
}
