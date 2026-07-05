import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const supabase = createClient();
    const { email, password } = validated;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials", timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    // Fetch user profile to check role and active status
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, isActive")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: "Failed to fetch user profile", timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    if (!profile.isActive) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: "Account is deactivated", timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

    const role = profile.role;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.user.id,
          email: data.user.email,
          role,
          user: {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.user_metadata?.firstName || null,
            lastName: data.user.user_metadata?.lastName || null,
            role,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    // Log the actual error for debugging
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}