import Airtable from "airtable";
import { createHash } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "sales_ai_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "sales_ai_salt_2024").digest("hex");
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable not configured");
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

  try {
    const records = await base("Users")
      .select({ filterByFormula: `{Email} = '${email}'`, maxRecords: 1 })
      .firstPage();

    if (records.length === 0) return null;

    const record = records[0];
    const storedHash = record.get("Password") as string;

    if (!verifyPassword(password, storedHash)) return null;

    await base("Users").update(record.id, {
      "Last Login": new Date().toISOString().split("T")[0],
    });

    return {
      id: record.id,
      email: record.get("Email") as string,
      name: (record.get("Name") as string) || "User",
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable not configured");
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

  try {
    const record = await base("Users").find(userId);
    const storedHash = record.get("Password") as string;

    if (!verifyPassword(currentPassword, storedHash)) return false;

    await base("Users").update(userId, { Password: hashPassword(newPassword) });
    return true;
  } catch (error) {
    console.error("Password change error:", error);
    return false;
  }
}

export function createSession(user: User): string {
  const sessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  return Buffer.from(JSON.stringify(sessionData)).toString("base64");
}

export function parseSession(sessionToken: string): User | null {
  try {
    const data = JSON.parse(Buffer.from(sessionToken, "base64").toString());
    if (data.expiresAt < Date.now()) return null;
    return { id: data.userId, email: data.email, name: data.name };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;
  return parseSession(sessionCookie.value);
}
