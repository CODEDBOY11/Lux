import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "./index";
import {
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import { AuthProvider, ProtectedRoute, useAuth } from "./AuthContext";
import LoginPage from "./Components/LoginPage";
import SignupPage from "./Components/SignupPage";
import AuthChooser from "./AuthChooser";
import ExplorePage from "./ExplorePage";
import HostDashboard from "./HostDashboard";
import GuestDashboard from "./GuestDashboard";
import AdminDashboard from "./Verification/admin";
import BookingPage from "./Components/BookingPage";
import Property from "./Components/property/property";
import Category from "./Components/Categories/category";
import WhyChooseUs from "./Components/Trust/trust";
import TestimonialsCTA from "./Components/action/action";
import Footer from "./Components/footer/footer";
import Hero from "./Components/Hero";
import PrivacyPolicy from "./Components/Pivacypolicy";
import TermsOfUse from "./Components/Termsofuse";
import BiometricVerify from "./Components/BiometricVerify";
import { setMemoryToken } from "./useBiometric";

import { ListingsDB, type Hotel, type Listing } from "./index";

// Prevent logged-in users from accessing auth pages
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "host") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}

// Dynamic Listing Route
function ListingRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    ListingsDB.getById(id)
      .then(setListing)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
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
        Loading…
      </div>
    );
  }

  if (!listing) {
    return <Navigate to="/explore" replace />;
  }

  const hotel: Hotel = {
    id: listing.id,
    hostId: listing.hostId,
    hostName: listing.hostName,
    createdAt: listing.createdAt,
    name: listing.name,
    location: listing.location,
    city: listing.city,
    country: listing.country,
    region: listing.country,
    description: listing.description,
    shortDescription:
      listing.description.length > 120
        ? `${listing.description.slice(0, 117)}...`
        : listing.description,
    pricePerNight: listing.pricePerNight,
    currency: "NGN",
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    category: listing.category,
    amenities: listing.amenities ?? [],
    images: listing.images ?? [],
    thumbnail: listing.images?.[0] ?? "",
    maxGuests: listing.maxGuests,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    tags: listing.tags ?? [],
    featured: listing.featured,
    available: listing.available,
  };

  return <BookingPage hotel={hotel} onBack={() => navigate(-1)} />;
}

// Home Page
function HomePage() {
  const navigate = useNavigate();
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  if (selectedHotel) {
    return (
      <BookingPage
        hotel={selectedHotel}
        onBack={() => setSelectedHotel(null)}
      />
    );
  }

  return (
    <>
      <Hero
        onBook={setSelectedHotel}
        onLogin={() => navigate("/login")}
        onSignup={() => navigate("/signup")}
      />
      <Property />
      <Category />
      <WhyChooseUs />
      <TestimonialsCTA />
      <Footer />
    </>
  );
}

// ── Capture token in memory the moment auth fires (bypasses Edge storage block) ──
function useSessionReady() {
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Check if we already have a session right now
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        setMemoryToken(data.session.access_token);
        setSessionReady(true);
      }
    });

    // Capture token immediately on every auth event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setMemoryToken(session?.access_token ?? null);
        setSessionReady(true);
      }
      if (event === "SIGNED_OUT") {
        setMemoryToken(null);
        setSessionReady(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return sessionReady;
}

// ── Host dashboard wrapper with biometric gate ─────────────────
function HostDashboardWrapper() {
  const { user } = useAuth();
  const sessionReady = useSessionReady();
  const [biometricPassed, setBiometricPassed] = useState(false);

  // Reset gate if user logs out and back in
  useEffect(() => {
    if (!user) setBiometricPassed(false);
  }, [user]);

  if (!user) return <Navigate to="/host/login" replace />;

  // Don't mount BiometricVerify until session token is confirmed live
  if (!sessionReady) {
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
        Securing session…
      </div>
    );
  }

  if (!biometricPassed) {
    return (
      <BiometricVerify
        userId={user.id}
        email={user.email ?? ""}
        isHost={true}
        onVerified={() => setBiometricPassed(true)}
        onSignOut={() => supabase.auth.signOut()}
      />
    );
  }

  return <HostDashboard />;
}

// ── Admin dashboard wrapper with biometric gate ────────────────
function AdminDashboardWrapper() {
  const { user } = useAuth();
  const sessionReady = useSessionReady();
  const [biometricPassed, setBiometricPassed] = useState(false);

  useEffect(() => {
    if (!user) setBiometricPassed(false);
  }, [user]);

  if (!user) return <Navigate to="/admin/login" replace />;

  if (!sessionReady) {
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
        Securing session…
      </div>
    );
  }

  if (!biometricPassed) {
    return (
      <BiometricVerify
        userId={user.id}
        email={user.email ?? ""}
        isHost={false} // blue accent for admin
        onVerified={() => setBiometricPassed(true)}
        onSignOut={() => supabase.auth.signOut()}
      />
    );
  }

  return <AdminDashboard adminId={user.id} />;
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login", { replace: true });
      }
    });
  }, []);

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
      Signing you in…
    </div>
  );
}

// Application Routes
function AppRoutes() {
  return (
    <Routes>
      {/* Generic /login and /signup */}
      <Route
        path="/login"
        element={
          <AuthGuard>
            <AuthChooser mode="login" />
          </AuthGuard>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthGuard>
            <AuthChooser mode="signup" />
          </AuthGuard>
        }
      />

      {/* Guest auth */}
      <Route
        path="/guest/login"
        element={
          <AuthGuard>
            <LoginPage fixedRole="guest" />
          </AuthGuard>
        }
      />
      <Route
        path="/guest/signup"
        element={
          <AuthGuard>
            <SignupPage fixedRole="guest" />
          </AuthGuard>
        }
      />

      {/* Host auth */}
      <Route
        path="/host/login"
        element={
          <AuthGuard>
            <LoginPage fixedRole="host" />
          </AuthGuard>
        }
      />
      <Route
        path="/host/signup"
        element={
          <AuthGuard>
            <SignupPage fixedRole="host" />
          </AuthGuard>
        }
      />

      {/* Admin login */}
      <Route
        path="/admin/login"
        element={
          <AuthGuard>
            <LoginPage fixedRole="admin" />
          </AuthGuard>
        }
      />

      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/listing/:id" element={<ListingRoute />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />

      {/* /dashboard — host with biometric gate */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            role="host"
            fallback={<Navigate to="/host/login" replace />}
          >
            <HostDashboardWrapper />
          </ProtectedRoute>
        }
      />

      {/* /account — guest, no biometric */}
      <Route
        path="/account"
        element={
          <ProtectedRoute
            role="guest"
            fallback={<Navigate to="/guest/login" replace />}
          >
            <GuestDashboard />
          </ProtectedRoute>
        }
      />

      {/* /admin — admin with biometric gate */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            role="admin"
            fallback={<Navigate to="/admin/login" replace />}
          >
            <AdminDashboardWrapper />
          </ProtectedRoute>
        }
      />

      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
