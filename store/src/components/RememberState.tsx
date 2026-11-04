"use client";
import { useEffect } from "react";
import { rememberState } from "@/lib/journey";

/** Renders nothing; records the state the visitor is looking at so /dashboard can continue their journey. */
export function RememberState({ code }: { code: string }) {
  useEffect(() => { rememberState(code); }, [code]);
  return null;
}
