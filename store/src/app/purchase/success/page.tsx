import { Suspense } from "react";
import Confirm from "./Confirm";
import { localModeRequested } from "@/lib/localMode";

export const metadata = { title: "Purchase", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={<p>Confirming your purchase…</p>}>
      <Confirm localMode={localModeRequested()} />
    </Suspense>
  );
}
