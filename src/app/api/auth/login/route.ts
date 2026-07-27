import { NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, cookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment variables.");
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user = { id: "admin-id-1", email: adminEmail, name: "Admin", role: "admin", image: null };
    
    const token = signSession(user);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return res;
  } catch (err: any) {
    console.error("login error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
