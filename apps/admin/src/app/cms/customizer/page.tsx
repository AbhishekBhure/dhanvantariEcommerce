"use client";

import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Store,
  Phone,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles,
  ShieldCheck,
  Leaf,
  Truck,
  Award,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSettings, updateSetting } from "@/store/adminSlice";

export default function StorefrontCustomizerPage() {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading, error } = useAppSelector((state) => state.admin.settings);
  const mutation = useAppSelector((state) => state.admin.mutation);

  const [activeTab, setActiveTab] = useState<"announcement" | "home" | "contact">("announcement");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Announcement state
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementLink, setAnnouncementLink] = useState("/shop");
  const [announcementBadge, setAnnouncementBadge] = useState("PURE AYURVEDA");

  // Contact & Social state
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");

  // Home Sections state
  const [storyHeading, setStoryHeading] = useState("");
  const [storyHighlight, setStoryHighlight] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [storyCtaText, setStoryCtaText] = useState("");
  const [storyCtaLink, setStoryCtaLink] = useState("/about");
  const [trustBadges, setTrustBadges] = useState<any[]>([]);

  useEffect(() => {
    void dispatch(loadSettings());
  }, [dispatch]);

  // Sync settings when loaded
  useEffect(() => {
    if (!settings) return;

    if (settings["announcement"]) {
      setAnnouncementEnabled(Boolean(settings["announcement"].isEnabled));
      setAnnouncementText(settings["announcement"].text || "");
      setAnnouncementLink(settings["announcement"].linkUrl || "/shop");
      setAnnouncementBadge(settings["announcement"].badgeText || "PURE AYURVEDA");
    }

    if (settings["info"]) {
      setBrandName(settings["info"].brandName || "Dhanvantari Ayurvedic Agencies");
      setTagline(settings["info"].tagline || "Pure Ayurveda, Modern Living");
      setPhone(settings["info"].phone || "+91 98765 43210");
      setWhatsapp(settings["info"].whatsappNumber || "919876543210");
      setEmail(settings["info"].email || "care@dhanvantari.in");
      setAddress(settings["info"].address || "");
      setHours(settings["info"].hours || "Mon – Sat: 9:00 AM – 7:00 PM IST");
      setInstagram(settings["info"].instagramUrl || "");
      setFacebook(settings["info"].facebookUrl || "");
      setYoutube(settings["info"].youtubeUrl || "");
    }

    if (settings["homeSections"]) {
      setStoryHeading(settings["homeSections"].storyHeading || "Rooted in Tradition,");
      setStoryHighlight(settings["homeSections"].storyHighlight || "Built for Today");
      setStoryDescription(settings["homeSections"].storyDescription || "");
      setStoryCtaText(settings["homeSections"].storyCtaText || "Learn Our Story");
      setStoryCtaLink(settings["homeSections"].storyCtaLink || "/about");
      setTrustBadges(settings["homeSections"].trustBadges || []);
    }
  }, [settings]);

  async function saveAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await dispatch(
        updateSetting({
          key: "announcement",
          value: {
            isEnabled: announcementEnabled,
            text: announcementText,
            linkUrl: announcementLink,
            badgeText: announcementBadge,
          },
        })
      ).unwrap();
      showSuccess("Announcement bar settings saved!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save announcement bar");
    }
  }

  async function saveContactInfo(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await dispatch(
        updateSetting({
          key: "info",
          value: {
            brandName,
            tagline,
            phone,
            whatsappNumber: whatsapp,
            email,
            address,
            hours,
            instagramUrl: instagram,
            facebookUrl: facebook,
            youtubeUrl: youtube,
          },
        })
      ).unwrap();
      showSuccess("Brand info & social links saved!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save brand settings");
    }
  }

  async function saveHomeSections(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await dispatch(
        updateSetting({
          key: "homeSections",
          value: {
            trustBadges,
            storyHeading,
            storyHighlight,
            storyDescription,
            storyCtaText,
            storyCtaLink,
          },
        })
      ).unwrap();
      showSuccess("Homepage sections saved!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save homepage settings");
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  function updateBadge(index: number, field: string, val: string) {
    setTrustBadges((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  return (
    <AdminLayout
      title="Storefront Customizer"
      subtitle="Theme & Content Settings"
    >
      {/* Feedback Messages */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 border-b flex gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("announcement")}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "announcement"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" /> Announcement Bar
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "home"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Homepage Sections & Trust Badges
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "contact"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Phone className="w-4 h-4" /> Brand, Contact & Social Links
        </button>
      </div>

      {/* Tab 1: Announcement Bar */}
      {activeTab === "announcement" && (
        <form onSubmit={saveAnnouncement} className="max-w-3xl space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Announcement Bar Toggle</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displays a top notification banner across every page of your storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  announcementEnabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    announcementEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Live Banner Preview */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Live Storefront Preview
              </label>
              <div className="p-3 bg-brand-950 text-white rounded-xl flex items-center justify-center gap-2 text-xs text-center border shadow-inner">
                {announcementBadge && (
                  <span className="bg-gold-500/20 text-gold-300 border border-gold-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {announcementBadge}
                  </span>
                )}
                <span>{announcementText || "Your announcement text will appear here..."}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  placeholder="e.g. PURE AYURVEDA or SPECIAL OFFER"
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Announcement Message</label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. 🌿 100% Authentic Ayurvedic Formulations — Flat ₹50 Delivery Charge on All Orders"
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Clickable Target URL</label>
                <input
                  type="text"
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  placeholder="e.g. /shop or /categories/hair-care"
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {mutation.isLoading ? "Saving..." : "Save Announcement Bar"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Homepage Sections */}
      {activeTab === "home" && (
        <form onSubmit={saveHomeSections} className="max-w-4xl space-y-8">
          {/* Brand Story Section */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b">
              Homepage Brand Story Banner
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Heading (Line 1)</label>
                <input
                  type="text"
                  value={storyHeading}
                  onChange={(e) => setStoryHeading(e.target.value)}
                  placeholder="Rooted in Tradition,"
                  className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Highlight (Gold Colored)</label>
                <input
                  type="text"
                  value={storyHighlight}
                  onChange={(e) => setStoryHighlight(e.target.value)}
                  placeholder="Built for Today"
                  className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Story Paragraph</label>
              <textarea
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
                placeholder="At Dhanvantari Ayurvedic Agencies, we combine centuries of Ayurvedic wisdom..."
                rows={3}
                className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Button Label</label>
                <input
                  type="text"
                  value={storyCtaText}
                  onChange={(e) => setStoryCtaText(e.target.value)}
                  placeholder="Learn Our Story"
                  className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Button Link</label>
                <input
                  type="text"
                  value={storyCtaLink}
                  onChange={(e) => setStoryCtaLink(e.target.value)}
                  placeholder="/about"
                  className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Trust Badges ("Why Dhanvantari") */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b">
              "Why Dhanvantari" Trust Pillars (4 Badges)
            </h3>
            <p className="text-xs text-slate-500">
              The four hallmark pillars displayed beneath the hero section on the customer homepage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trustBadges.map((badge, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">Badge #{idx + 1}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Icon: {badge.icon}</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={badge.title}
                      onChange={(e) => updateBadge(idx, "title", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={badge.description}
                      onChange={(e) => updateBadge(idx, "description", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {mutation.isLoading ? "Saving..." : "Save Homepage Sections"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Brand, Contact & Social Links */}
      {activeTab === "contact" && (
        <form onSubmit={saveContactInfo} className="max-w-3xl space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b">
              Brand Identity & Header Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 pt-4 pb-2 border-b">
              Customer Support & Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp Number (e.g. 919876543210)</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Support Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Working Hours</label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Physical Store / Office Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <h3 className="text-sm font-bold text-slate-900 pt-4 pb-2 border-b">
              Social Media Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facebook URL</label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">YouTube URL</label>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {mutation.isLoading ? "Saving..." : "Save Brand & Contact Info"}
              </button>
            </div>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
