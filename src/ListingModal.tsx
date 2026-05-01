/**
 * components/ListingModal.tsx
 *
 * Full create / edit listing modal.
 * Saves directly to ListingsDB.
 * Image URLs entered as newline-separated text — swap for file upload in production.
 */

import { useState, useEffect, type KeyboardEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ListingsDB, type Listing } from "./index";

type Props = {
  listing: Listing | null; // null = create mode
  hostId: string;
  hostName: string;
  onClose: () => void;
  onSaved: () => void;
};

const CATEGORIES = [
  "villa",
  "apartment",
  "resort",
  "boutique",
  "penthouse",
] as const;

export default function ListingModal({
  listing,
  hostId,
  hostName,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "",
    country: "",
    location: "",
    category: "villa" as (typeof CATEGORIES)[number],
    pricePerNight: "",
    bedrooms: "",
    bathrooms: "",
    maxGuests: "",
    imageUrls: "", // newline-separated
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [amenInput, setAmenInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (listing) {
      setForm({
        name: listing.name,
        description: listing.description,
        city: listing.city,
        country: listing.country,
        location: listing.location,
        category: listing.category,
        pricePerNight: String(listing.pricePerNight),
        bedrooms: String(listing.bedrooms),
        bathrooms: String(listing.bathrooms),
        maxGuests: String(listing.maxGuests),
        imageUrls: listing.images.join("\n"),
      });
      setAmenities([...listing.amenities]);
      setTags([...listing.tags]);
    }
  }, [listing]);

  const addChip = (type: "amen" | "tags") => {
    const val = (type === "amen" ? amenInput : tagInput).trim();
    if (!val) return;
    if (type === "amen" && !amenities.includes(val))
      setAmenities((a) => [...a, val]);
    if (type === "tags" && !tags.includes(val)) setTags((t) => [...t, val]);
    type === "amen" ? setAmenInput("") : setTagInput("");
  };

  const handleKeyDown = (e: KeyboardEvent, type: "amen" | "tags") => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(type);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.pricePerNight || isNaN(Number(form.pricePerNight)))
      e.pricePerNight = "Valid price required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.country.trim()) e.country = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const images = form.imageUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const data = {
        hostId,
        hostName,
        name: form.name.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        location: form.location.trim() || `${form.city}, ${form.country}`,
        category: form.category,
        pricePerNight: Number(form.pricePerNight),
        bedrooms: Number(form.bedrooms) || 1,
        bathrooms: Number(form.bathrooms) || 1,
        maxGuests: Number(form.maxGuests) || 2,
        amenities,
        tags,
        images,
      };
      if (listing) {
        ListingsDB.update(listing.id, data);
      } else {
        ListingsDB.add(data);
      }
      setSaving(false);
      onSaved();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1c18] border border-[rgba(245,240,232,0.08)] rounded-3xl w-full max-w-[560px] max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e1c18] px-7 pt-6 pb-4 border-b border-[rgba(245,240,232,0.06)] flex items-center justify-between z-10">
          <h2 className="font-['Cormorant Garamond'] text-xl font-medium text-[#f5f0e8]">
            {listing ? "Edit Listing" : "Add New Listing"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#252220] border border-[rgba(245,240,232,0.08)] flex items-center justify-center text-[rgba(245,240,232,0.5)] hover:text-[#f5f0e8] transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 space-y-4">
          {/* Name */}
          <Field label="Property Name" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Villa Lumière Côte d'Azur"
              className={input(!!errors.name)}
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Describe your property in detail…"
              className={`${input(false)} resize-none`}
            />
          </Field>

          {/* City / Country */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" error={errors.city}>
              <input
                type="text"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="Paris"
                className={input(!!errors.city)}
              />
            </Field>
            <Field label="Country" error={errors.country}>
              <input
                type="text"
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
                placeholder="France"
                className={input(!!errors.country)}
              />
            </Field>
          </div>

          {/* Full location */}
          <Field label="Full Location (optional)">
            <input
              type="text"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Saint-Germain-des-Prés, Paris 6e"
              className={input(false)}
            />
          </Field>

          {/* Category / Price */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as (typeof CATEGORIES)[number],
                  }))
                }
                className={`${input(false)} cursor-pointer`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price / Night (USD)" error={errors.pricePerNight}>
              <input
                type="number"
                value={form.pricePerNight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerNight: e.target.value }))
                }
                placeholder="500"
                min="1"
                className={input(!!errors.pricePerNight)}
              />
            </Field>
          </div>

          {/* Bed / Bath / Guests */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ["bedrooms", "Bedrooms", "2"],
              ["bathrooms", "Bathrooms", "2"],
              ["maxGuests", "Max Guests", "4"],
            ].map(([key, label, placeholder]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  value={form[key as keyof typeof form]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  min="0"
                  className={input(false)}
                />
              </Field>
            ))}
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
              Amenities (press Enter to add)
            </label>
            <div className="flex flex-wrap gap-2 bg-[#252220] border border-[rgba(245,240,232,0.08)] rounded-xl p-3 min-h-[52px] focus-within:border-[#C9A96E] transition-colors cursor-text">
              {amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1.5 bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.25)] rounded-full px-3 py-1 text-xs text-[#C9A96E]"
                >
                  {a}
                  <button
                    onClick={() =>
                      setAmenities((prev) => prev.filter((x) => x !== a))
                    }
                    className="text-[#C9A96E] hover:text-[#f5f0e8] leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={amenInput}
                onChange={(e) => setAmenInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "amen")}
                placeholder={amenities.length === 0 ? "Pool, WiFi, Spa…" : ""}
                className="bg-transparent outline-none text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] flex-1 min-w-[80px]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
              Tags (press Enter to add)
            </label>
            <div className="flex flex-wrap gap-2 bg-[#252220] border border-[rgba(245,240,232,0.08)] rounded-xl p-3 min-h-[52px] focus-within:border-[#C9A96E] transition-colors cursor-text">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.25)] rounded-full px-3 py-1 text-xs text-[#C9A96E]"
                >
                  {t}
                  <button
                    onClick={() =>
                      setTags((prev) => prev.filter((x) => x !== t))
                    }
                    className="text-[#C9A96E] hover:text-[#f5f0e8] leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "tags")}
                placeholder={tags.length === 0 ? "Sea View, Romantic…" : ""}
                className="bg-transparent outline-none text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] flex-1 min-w-[80px]"
              />
            </div>
          </div>

          {/* Image URLs */}
          <Field label="Image URLs (one per line)">
            <textarea
              rows={3}
              value={form.imageUrls}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrls: e.target.value }))
              }
              placeholder={
                "https://images.unsplash.com/photo-…\nhttps://images.unsplash.com/photo-…"
              }
              className={`${input(false)} resize-none text-xs`}
            />
            <p className="text-[11px] text-[rgba(245,240,232,0.3)] mt-1">
              Paste Unsplash or CDN image URLs. One per line.
            </p>
          </Field>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#C9A96E] disabled:opacity-50 text-[#0e0d0b] font-medium py-3.5 rounded-xl text-sm hover:bg-[#dfc08a] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[rgba(0,0,0,0.2)] border-t-[#0e0d0b] rounded-full animate-spin" />
                Saving…
              </>
            ) : listing ? (
              "Save Changes →"
            ) : (
              "Publish Listing →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helpers
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.45)] mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-[#e07070] mt-1">{error}</p>}
    </div>
  );
}

function input(hasError: boolean) {
  return `w-full bg-[#252220] border rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[rgba(245,240,232,0.2)] outline-none transition-all focus:border-[#C9A96E] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] ${hasError ? "border-[#e07070]" : "border-[rgba(245,240,232,0.08)]"} font-['DM_Sans'] appearance-none`;
}
