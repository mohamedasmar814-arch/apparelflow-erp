"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { createSession } from "../../lib/auth";

export type LoginState = {
  error: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  // Basic validation
  if (!email || !password) {
    return {
      error: "Email and password are required.",
    };
  }

  // Find the user in PostgreSQL
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return {
      error: "Invalid email or password.",
    };
  }

  // Compare entered password with stored bcrypt hash
  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return {
      error: "Invalid email or password.",
    };
  }

  // Create secure login session
  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  // Redirect according to the user's role
  switch (user.role) {
    case "CUTTING":
      redirect("/cutting");

    case "VERIFICATION":
      redirect("/verification");

    case "SEWING":
      redirect("/sewing");

    default:
      redirect("/login");
  }
}