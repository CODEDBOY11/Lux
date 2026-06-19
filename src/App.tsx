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

// Admin wrapper — passes logged-in user's id to AdminDashboard
function AdminDashboardWrapper() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  return <AdminDashboard adminId={user.id} />;
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically handles the token from the URL hash.
    // onAuthStateChange in AuthContext fires and navigates from there.
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
      {/* Generic /login and /signup — simple chooser, no portal switcher */}
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

      {/* Guest auth — fixed role, no switcher */}
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

      {/* Host auth — fixed role, no switcher */}
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

      {/* Admin login — quiet, unlinked from public nav, no signup ever */}
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

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            role="host"
            fallback={<Navigate to="/host/login" replace />}
          >
            <HostDashboard />
          </ProtectedRoute>
        }
      />
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
