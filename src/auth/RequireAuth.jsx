import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RequireAuth({ children }) {
  const { ready, session } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div style={{ padding: 24, fontWeight: 800 }}>
        Checking authentication…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
