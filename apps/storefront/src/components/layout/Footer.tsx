import React from "react";
import Link from "next/link";
import { Leaf, Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  shop: [
    { href: "/shop", label: "All Products" },
    { href: "/categories/hair-care", label: "Hair Care" },
    { href: "/categories/skin-care", label: "Skin Care" },
    { href: "/categories/health-wellness", label: "Health & Wellness" },
    { href: "/categories/body-care", label: "Body Care" },
  ],
  help: [
    { href: "/account/orders", label: "Track Order" },
    { href: "/contact", label: "Contact Us" },
    { href: "/shipping-policy", label: "Shipping Policy" },
    { href: "/return-policy", label: "Return & Refund Policy" },
    { href: "/faq", label: "FAQ" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-conditions", label: "Terms & Conditions" },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-950 text-white" role="contentinfo">
      {/* Main footer */}
      <div className="section-container py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group" aria-label="Dhanvantari Ayurvedic Agencies">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600 group-hover:bg-brand-500 transition-colors">
                <Leaf className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-tight">Dhanvantari</div>
                <div className="text-xs text-brand-300 leading-tight">Ayurvedic Agencies</div>
              </div>
            </Link>
            <p className="text-brand-300 text-sm leading-relaxed mb-6">
              {/* DEMO — Replace with actual brand description */}
              Authentic Ayurvedic products crafted with time-tested formulations for modern wellness.
            </p>

            {/* Social links — update hrefs with actual social URLs */}
            <div className="flex gap-3">
              {[
                { href: "#", icon: Instagram, label: "Follow us on Instagram" },
                { href: "#", icon: Facebook, label: "Follow us on Facebook" },
                { href: "#", icon: Youtube, label: "Subscribe on YouTube" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-800 hover:bg-brand-700 transition-colors text-brand-300 hover:text-white"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <nav aria-label="Shop navigation">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-400 mb-4">
              Shop
            </h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Help */}
          <nav aria-label="Help navigation">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-400 mb-4">
              Help
            </h3>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-400 mb-4">
              Contact
            </h3>
            <address className="not-italic space-y-3">
              {/* DEMO — Replace with actual contact details */}
              <div className="flex items-start gap-2 text-sm text-brand-300">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <a href="mailto:info@dhanvantari.in" className="hover:text-white transition-colors">
                  info@dhanvantari.in
                </a>
              </div>
              <div className="flex items-start gap-2 text-sm text-brand-300">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <a href="tel:+91XXXXXXXXXX" className="hover:text-white transition-colors">
                  +91-XXXX-XXXXXX
                </a>
              </div>
              <div className="flex items-start gap-2 text-sm text-brand-300">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>[DEMO — Replace with actual address]</span>
              </div>
            </address>

            {/* Company info */}
            <div className="mt-4 space-y-1">
              {footerLinks.company.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-800">
        <div className="section-container py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-brand-400">
            <p>
              &copy; {currentYear} Dhanvantari Ayurvedic Agencies. All rights reserved.
            </p>
            <p>
              Made with 🌿 in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
