import { Suspense } from "react";
import Confirm from "./Confirm";

export const metadata = { title: "Purchase", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={<p>Confirming your purchase…</p>}>
      <Confirm />
    </Suspense>
  );
}
