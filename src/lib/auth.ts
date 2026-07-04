// ====================================================================
// AVIORA — Authentication & Authorization Helpers
// Provides utilities for role-based access control.
// Role is determined by email domain (isAdminEmail) — no DB call needed.
// ====================================================================

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/** Authorized user shape returned by auth helpers */
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly role: "ADMIN" | "CUSTOMER";
}

/**
 * Retrieves the currently authenticated user from Supabase Auth.
 * Role is derived from email domain matching the ADMIN_EMAIL_DOMAINS list.
 *
 * @returns AuthUser with role, or null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  const role = isAdminEmail(authUser.email) ? "ADMIN" : "CUSTOMER";

  return {
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.user_metadata?.firstName || null,
    lastName: authUser.user_metadata?.lastName || null,
    role,
  };
}

/**
 * Ensures the user is authenticated. Redirects to /auth/login if not.
 * Returns the authenticated user if found.
 */
export async function requireAuth(): Promise<AuthUser> {
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
export async function requireAdmin(): Promise<AuthUser> {
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
export function hasRole(userRole: string, requiredRole: string): boolean {
  const hierarchy: Record<string, number> = {
    CUSTOMER: 0,
    ADMIN: 1,
  };
  return (hierarchy[userRole] ?? -1) >= (hierarchy[requiredRole] ?? 0);
}
