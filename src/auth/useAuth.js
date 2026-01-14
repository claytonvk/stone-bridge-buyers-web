import { useContext } from "react";
import { AuthCtx } from "./AuthCtx";

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider />");
  return v;
}
