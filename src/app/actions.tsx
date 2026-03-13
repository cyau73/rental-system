// src/app/actions.ts
"use server"; // This directive at the TOP of the file is required

import { signOut } from "@/auth";

export async function handleLogout() {
    await signOut({ redirectTo: "/login" });
}