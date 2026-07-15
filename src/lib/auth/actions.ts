"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import {
  changePasswordService,
  requestPasswordResetService,
  resetPasswordWithTokenService,
} from "@/lib/services/password";

export async function loginAction(formData: FormData) {
  try {
    const email = z.string().email().parse(String(formData.get("email") ?? ""));
    const password = z.string().parse(String(formData.get("password") ?? ""));
    const normalized = email.trim().toLowerCase();

    const users = await prisma.user.findMany({
      include: { role: { select: { slug: true } } },
    });
    const found = users.find((u) => u.email.toLowerCase() === normalized);

    if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
      return { ok: false as const, error: "Invalid email or password" };
    }

    await createSession(found.id);
    redirect(found.role.slug === "ae" ? "/ae-dashboard" : "/command-center");
  } catch (e) {
    // Next.js redirect() throws; rethrow so navigation works
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      typeof (e as { digest?: unknown }).digest === "string" &&
      String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("[loginAction]", e);
    return {
      ok: false as const,
      error:
        "Sign-in failed — database is unavailable. On Vercel, set a Postgres DATABASE_URL (see VERCEL.md).",
    };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  try {
    return await requestPasswordResetService(email);
  } catch {
    return {
      ok: false as const,
      message: "Enter a valid email address.",
    };
  }
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) {
    return { ok: false as const, error: "Passwords do not match" };
  }
  try {
    await resetPasswordWithTokenService({ token, password });
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Reset failed",
    };
  }
  redirect("/login?reset=1");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  try {
    await changePasswordService(user, {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    });
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Could not change password",
    };
  }
}
