import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    const supabase = createClient();
    const { email, password, firstName, lastName } = validated;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: firstName || "",
          lastName: lastName || "",
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Failed to create user", timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    // Determine role based on email domain
    const role = isAdminEmail(email) ? UserRole.ADMIN : UserRole.CUSTOMER;

    // Create Prisma user record
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        passwordHash: "", // Supabase handles password hashing
        firstName: firstName || null,
        lastName: lastName || null,
        role,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}