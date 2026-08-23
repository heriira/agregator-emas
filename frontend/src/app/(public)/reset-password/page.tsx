import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 md:py-12">
      <ResetPasswordForm token={token} />
    </main>
  );
}
