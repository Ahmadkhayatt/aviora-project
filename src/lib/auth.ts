// ====================================================================
// AVIORA — Authentication & Authorization Helpers
// Provides utilities for role-based access control.
// ====================================================================

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

/**
 * Retrieves the currently authenticated user session from Supabase,
 * then fetches the full user record from Prisma (including role).
 *
 * @returns The authenticated user with role, or null if not authenticated.
 */
export async function getAuthenticatedUser() {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  return user;
}

/**
 * Ensures the user is authenticated. Redirects to /auth/login if not.
 * Returns the authenticated user if found.
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

/**
 * Ensures the user has an ADMIN role. Redirects to / if not admin.
 * Returns the authenticated admin user if authorized.
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}

/**
 * Checks if an email domain is whitelisted for admin access.
 */
export function isAdminEmail(email: string): boolean {
  const allowedDomains = (process.env.ADMIN_EMAIL_DOMAINS || "avoria.com")
    .split(",")
    .map((d) => d.trim().toLowerCase());

  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? allowedDomains.includes(domain) : false;
}

/**
 * Checks if a user role has sufficient privileges.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    CUSTOMER: 0,
    ADMIN: 1,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}
