import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import { AuthProvider, ProtectedRoute, useAuth } from "./AuthContext";
import AuthRouter from "./AuthRouter";
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

import { ListingsDB, type Hotel, type Listing } from "./index";

// 🔐 Prevent logged-in users from accessing auth pages
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // ✅ Don't redirect while Firebase is still resolving the OAuth result
  if (loading) return null;

  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "host") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}

// 🏨 Dynamic Listing Route
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

// 🏠 Home Page
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

// 🔑 Admin wrapper — passes logged-in user's id to AdminDashboard
function AdminDashboardWrapper() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AdminDashboard adminId={user.id} />;
}

// 🛣️ Application Routes
function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages — redirect away if already logged in */}
      <Route
        path="/signup"
        element={
          <AuthGuard>
            <AuthRouter defaultView="signup" />
          </AuthGuard>
        }
      />
      <Route
        path="/login"
        element={
          <AuthGuard>
            <AuthRouter defaultView="login" />
          </AuthGuard>
        }
      />

      {/* Public routes */}
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/listing/:id" element={<ListingRoute />} />

      {/* Host dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            role="host"
            fallback={<Navigate to="/login" replace />}
          >
            <HostDashboard />
          </ProtectedRoute>
        }
      />

      {/* Guest dashboard */}
      <Route
        path="/account"
        element={
          <ProtectedRoute
            role="guest"
            fallback={<Navigate to="/login" replace />}
          >
            <GuestDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            role="admin"
            fallback={<Navigate to="/login" replace />}
          >
            <AdminDashboardWrapper />
          </ProtectedRoute>
        }
      />

      {/* Home */}
      <Route path="/" element={<HomePage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// 🚀 Main App Component
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
