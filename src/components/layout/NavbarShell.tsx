"use client";

import type { SessionUser } from "@/types/matrix";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import Navbar from "./Navbar";

export default function NavbarShell({ user }: { user: SessionUser | null }) {
  const { connection } = useMatrix();
  return <Navbar user={user} connection={connection} />;
}
