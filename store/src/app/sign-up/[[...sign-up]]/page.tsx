import { redirect } from "next/navigation";
import { safeRedirect } from "@/lib/buy";
import { localModeRequested } from "@/lib/localMode";

export const metadata = { title: "Create an account", robots: { index: false, follow: true } };

export default async function Page({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const destination = safeRedirect((await searchParams).redirect_url, "/dashboard");
  if (localModeRequested()) redirect("/sign-in?redirect_url=" + encodeURIComponent(destination));
  const { auth } = await import("@clerk/nextjs/server");
  const { SignUp } = await import("@clerk/nextjs");
  const { userId } = await auth();
  if (userId) redirect(destination);
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
      <SignUp forceRedirectUrl={destination} signInForceRedirectUrl={destination} signInUrl={"/sign-in?redirect_url=" + encodeURIComponent(destination)} />
    </div>
  );
}
