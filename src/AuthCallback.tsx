// src/pages/AuthCallback.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./index";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishAuth = async () => {
      // Get current session
      const { data, error } = await supabase.auth.getSession();

      console.log("📍 AuthCallback - OAuth Session:", data.session);
      console.log("📍 AuthCallback - OAuth Error:", error);

      if (error) {
        console.error("❌ OAuth callback error:", error);
      }

      // Wait a bit to let onAuthStateChange listener process the session
      // The listener will handle navigation
      await new Promise((r) => setTimeout(r, 500));

      // Navigate to home - the AuthContext listener will redirect to correct place
      navigate("/", { replace: true });
    };

    finishAuth();
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0e0d0b",
        color: "#C9A96E",
        fontFamily: "Cormorant Garamond, serif",
        fontSize: 22,
        gap: 12,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          border: "2px solid rgba(201,169,110,0.3)",
          borderTopColor: "#C9A96E",
          borderRadius: "50%",
          display: "inline-block",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Completing sign in...
    </div>
  );
}
