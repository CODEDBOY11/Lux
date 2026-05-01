import { useState } from "react";
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
import BookingPage from "./Components/BookingPage";
import Property from "./Components/property/property";
import Category from "./Components/Categories/category";
import WhyChooseUs from "./Components/Trust/trust";
import TestimonialsCTA from "./Components/action/action";
import Footer from "./Components/footer/footer";
import Hero from "./Components/Hero";

import { ListingsDB, type Hotel } from "./index"; // Recommended location

// 🔐 Prevent logged-in users from accessing auth pages
function AuthGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return (
      <Navigate to={user.role === "host" ? "/dashboard" : "/explore"} replace />
    );
  }

  return <>{children}</>;
}

// 🏨 Dynamic Listing Route
function ListingRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listing = id ? ListingsDB.getById(id) : undefined;

  if (!listing) {
    return <Navigate to="/explore" replace />;
  }

  const hotelCategory = listing.category;

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
    currency: "NGN", // Change to "USD" if needed
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    category: hotelCategory,
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

// 🛣️ Application Routes
function AppRoutes() {
  return (
    <Routes>
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

      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/listing/:id" element={<ListingRoute />} />

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

      <Route path="/" element={<HomePage />} />
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
