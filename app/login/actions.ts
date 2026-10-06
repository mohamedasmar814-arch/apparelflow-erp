"use server";

import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { createSession } from "../../lib/auth";

export type LoginState = {
  error: string;
  redirectTo?: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Email and password are required.",
    };
  }

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

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    return {
      error: "Invalid email or password.",
    };
  }

  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  switch (user.role) {
    case "CUTTING":
      return {
        error: "",
        redirectTo: "/cutting",
      };

    case "VERIFICATION":
      return {
        error: "",
        redirectTo: "/verification",
      };

    case "SEWING":
      return {
        error: "",
        redirectTo: "/sewing",
      };

    default:
      return {
        error: "Your account does not have a valid system role.",
      };
  }
}