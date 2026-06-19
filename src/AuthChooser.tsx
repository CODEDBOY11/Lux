import { useNavigate } from "react-router-dom";
import { BuildingOffice2Icon, UserIcon } from "@heroicons/react/24/outline";

const AuthChooser = ({ mode }: { mode: "login" | "signup" }) => {
  const navigate = useNavigate();
  const title = mode === "login" ? "Welcome back" : "Join LuxStay";
  const subtitle =
    mode === "login"
      ? "Sign in to continue"
      : "Choose how you'd like to get started";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0d0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 36,
              color: "#f5f0e8",
              marginBottom: 8,
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(245,240,232,0.45)" }}>
            {subtitle}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <button
            onClick={() => navigate(`/guest/${mode}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px 24px",
              borderRadius: 18,
              border: "1px solid rgba(110,173,201,0.25)",
              background: "rgba(110,173,201,0.06)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(110,173,201,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <UserIcon style={{ width: 22, height: 22, color: "#6EADC9" }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#f5f0e8" }}>
                I'm a Traveller
              </p>
              <p style={{ fontSize: 12, color: "rgba(245,240,232,0.4)" }}>
                Browse and book luxury stays
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate(`/host/${mode}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px 24px",
              borderRadius: 18,
              border: "1px solid rgba(201,169,110,0.25)",
              background: "rgba(201,169,110,0.06)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(201,169,110,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BuildingOffice2Icon
                style={{ width: 22, height: 22, color: "#C9A96E" }}
              />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#f5f0e8" }}>
                I'm a Property Host
              </p>
              <p style={{ fontSize: 12, color: "rgba(245,240,232,0.4)" }}>
                List your property and manage bookings
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthChooser;
