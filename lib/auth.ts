import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins/two-factor";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { stubSendEmail } from "@/lib/email";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("BETTER_AUTH_SECRET is required in production");
}

export const auth = betterAuth({
  appName: "Smart For Bid",
  baseURL: process.env.BETTER_AUTH_URL || "http://127.0.0.1:3100",
  secret: secret || "dev-only-insecure-secret-change-me",
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    twoFactor({
      issuer: "Smart For Bid",
      otpOptions: {
        async sendOTP({ user, otp }) {
          await stubSendEmail({
            to: user.email,
            subject: "Smart For Bid — verification code",
            text: `Your verification code is ${otp}`,
          });
        },
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
