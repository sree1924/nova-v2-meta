import { NextRequest, NextResponse } from "next/server";
import { rejectLocalMutation, writeLocalCookies } from "@/lib/localSession";
import { localUrl } from "@/lib/localMode";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const denied = rejectLocalMutation(req);
  if (denied) return denied;
  return writeLocalCookies(NextResponse.redirect(localUrl(req, "/"), 303), null);
}
