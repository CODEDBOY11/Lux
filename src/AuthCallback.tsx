// src/pages/AuthCallback.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./index";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      console.log("OAuth Session:", data.session);
      console.log("OAuth Error:", error);

      navigate("/", { replace: true });
    };

    finishAuth();
  }, [navigate]);

  return <div>Signing you in...</div>;
}
