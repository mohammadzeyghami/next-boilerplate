import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import bcrypt from "bcryptjs";
import type { Provider } from "next-auth/providers";

import { prisma } from "@/lib/prisma";

const providers: Provider[] = [];

function getEmailServerConfig(raw: string) {
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    port: parsed.port
      ? Number(parsed.port)
      : parsed.protocol === "smtps:"
        ? 465
        : 587,
    secure: parsed.protocol === "smtps:",
    auth: {
      user: decodeURIComponent(parsed.username),
      pass: decodeURIComponent(parsed.password),
    },
    family: 4,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  };
}

if (process.env.AUTH_EMAIL_SERVER && process.env.AUTH_EMAIL_FROM) {
  providers.push(
    Email({
      server: getEmailServerConfig(process.env.AUTH_EMAIL_SERVER),
      from: process.env.AUTH_EMAIL_FROM,
    }),
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET) {
  providers.push(
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET,
      authorization: { params: { scope: "openid profile email" } },
      issuer: "https://www.linkedin.com/oauth",
    }),
  );
}

providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image ?? undefined,
      };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture =
          "image" in user && user.image != null ? user.image : token.picture;
      } else if (token.sub) {
        const pic = token.picture as string | null | undefined;
        if (pic == null || pic === "") {
          const row = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { image: true },
          });
          if (row?.image) {
            token.picture = row.image;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email as string;
        session.user.name = token.name as string | null | undefined;

        let image =
          (token.picture as string | null | undefined)?.trim() ||
          session.user.image?.trim() ||
          "";

        if (!image && token.sub) {
          const row = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { image: true },
          });
          if (row?.image) {
            image = row.image;
          }
        }

        session.user.image = image || null;
      }
      return session;
    },
  },
});
