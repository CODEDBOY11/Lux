/**
 * AuthRouter.tsx
 *
 * Drop this into your app's routing setup.
 * Connects SignupPage ↔ LoginPage with navigation callbacks.
 *
 * Usage with React Router:
 *   <Route path="/signup" element={<AuthRouter defaultView="signup" />} />
 *   <Route path="/login"  element={<AuthRouter defaultView="login"  />} />
 *
 * Or use standalone:
 *   <AuthRouter defaultView="signup" />
 */

import { useState } from "react";
import SignupPage from "./Components/SignupPage";
import LoginPage from "./Components/LoginPage";

type AuthView = "signup" | "login";

type Props = {
  defaultView?: AuthView;
};

const AuthRouter = ({ defaultView = "signup" }: Props) => {
  const [view, setView] = useState<AuthView>(defaultView);

  if (view === "signup") {
    return <SignupPage onNavigateToLogin={() => setView("login")} />;
  }

  return <LoginPage onNavigateToSignup={() => setView("signup")} />;
};

export default AuthRouter;
