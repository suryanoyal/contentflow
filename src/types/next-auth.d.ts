import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      clientId: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    clientId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    clientId: string | null;
  }
}
