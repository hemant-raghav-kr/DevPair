import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const appUrl = getAppUrl();
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  let baseUrl = appUrl;
  if (isLocalEnv) {
    baseUrl = origin || "http://localhost:3000";
  } else if (forwardedHost) {
    baseUrl = `https://${forwardedHost}`;
  } else if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    baseUrl = origin;
  }

  const safeNext = next.startsWith("/") ? next : `/${next}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${safeNext}`);
    }
  }

  // Redirect to login with error parameter if code exchange fails
  return NextResponse.redirect(`${baseUrl}/login?error=auth-code-error`);
}

