import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isChefArea = path.startsWith("/chef") && path !== "/chef/login";
  const isManagerArea = path.startsWith("/manager") && path !== "/manager/login";

  if ((isChefArea || isManagerArea) && !user) {
    const loginPath = isChefArea ? "/chef/login" : "/manager/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (user && (isChefArea || isManagerArea)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Chefs can never open manager pages; managers can access both.
    if (isChefArea && profile?.role !== "chef" && profile?.role !== "manager") {
      return NextResponse.redirect(new URL("/chef/login", request.url));
    }
    if (isManagerArea && profile?.role !== "manager") {
      return NextResponse.redirect(new URL("/manager/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/chef/:path*", "/manager/:path*"],
};
