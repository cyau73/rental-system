import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

import prisma from "@/lib/prisma"; // Adjust path to your new file

// 1. Define both lists at the top
const ADMIN_EMAILS = ["christopheryaukm@gmail.com"];
const STAFF_EMAILS = ["cyau73@gmail.com", "dsvgoh@gmail.com"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } }
    }),
  ],
  pages: {
    signIn: "/login", // Optional: point to a custom login page if you have one
    error: "/login",
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdminPage = nextUrl.pathname.startsWith("/admin");

      if (isOnAdminPage) {
        if (isLoggedIn) return true; // Allow access if logged in
        return false; // Redirect unauthenticated users to login
      }

      // If they just logged in and are on the home page, 
      // you can force them to /admin here or handle it via a button.
      return true;
    },

    // 2. The Guard: Allow entry if the email is in EITHER list
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();

      // If they are Admin OR Staff, let them in. Otherwise, block.
      return ADMIN_EMAILS.includes(email) || STAFF_EMAILS.includes(email);
    },

    // 3. The ID Card: Check the DB and tell the website the role
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // This takes whatever is in your Prisma DB column "role" 
        // and attaches it to the session.
        // @ts-ignore
        session.user.role = user.role;
      }
      return session;
    },
  },

  // 4. The Auto-Updater: Ensures the DB matches your code lists
  events: {
    async signIn({ user }) {
      if (user.email) {
        const email = user.email.toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(email);
        const assignedRole = isAdmin ? "ADMIN" : "STAFF";
        console.log(`${email} :  ${assignedRole}`);

        // If they just logged in, update their DB record to match the lists above
        await prisma.user.update({
          where: { email: email },
          data: { role: assignedRole },
        });
      }
    }
  }
})
