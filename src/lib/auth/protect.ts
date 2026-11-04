export function shouldProtectPath(pathname: string): boolean {
  if (pathname.startsWith("/acceso")) return false;
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico") return false;
  return true;
}
