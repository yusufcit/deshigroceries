import Link from "next/link";
import { Shield, Truck, Mail, Phone, MapPin, CreditCard, Clock } from "lucide-react"; 

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-transparent flex flex-col items-center pt-12 md:pt-16 relative z-10">
      
      {/* ─── 1. CLEAN WHITE NEWSLETTER STRIP ─── */}
      <div className="w-full bg-white flex justify-center border-t border-b border-gray-100">
        <div className="container-custom w-full py-12 md:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                Get <span className="text-[var(--primary)]">€5 Off</span> Your First Order
              </h3>
              <p className="text-gray-500 text-base font-medium">
                Subscribe for exclusive offers and fresh grocery updates
              </p>
            </div>
            <div className="flex w-full md:w-auto rounded-xl border border-gray-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-5 py-3 border-0 focus:outline-none text-gray-900 bg-white placeholder-gray-400 text-base"
              />
              <button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold px-6 py-3 transition-colors duration-200 cursor-pointer text-base">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* ─── 2. DARK CHARCOAL CONTAINER FOR LOWER SECTIONS ─── */}
      {/* FIX: Added mt-16 md:mt-24 to physically push the dark links block down from the white newsletter block. 
         Added relative isolate z-10 to prevent background overlap glitches. */}
      <div className="w-full bg-gray-900 flex flex-col items-center mt-16 md:mt-24 relative isolate z-10 border-t border-gray-800/50">
        
        {/* ─── MAIN FOOTER LINKS GRID ─── */}
        <div className="container-custom w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* About Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-extrabold tracking-tight">DG</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Deshi Grocery</h3>
                  <span className="text-xs text-[var(--primary-soft)] font-medium">Fresh Halal Delivery</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Your trusted source for premium halal meat, fish, and groceries in Dublin, Ireland. 
                Quality products at competitive prices, delivered to your door.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5 bg-green-900/50 text-green-300 px-3 py-1.5 rounded-full">
                  <Shield className="w-3.5 h-3.5" />
                  100% Halal
                </span>
                <span className="flex items-center gap-1.5 bg-blue-900/50 text-blue-300 px-3 py-1.5 rounded-full">
                  <Truck className="w-3.5 h-3.5" />
                  Dublin Delivery
                </span>
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 className="text-white font-bold mb-6 relative inline-block">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[var(--primary)] rounded-full" />
              </h3>
              <ul className="space-y-3">
                {[
                  { href: '/shop', label: 'Shop All Products' },
                  { href: '/categories', label: 'Categories' },
                  { href: '/categories/chicken', label: 'Chicken' },
                  { href: '/categories/lamb', label: 'Lamb' },
                  { href: '/categories/beef', label: 'Beef' },
                  { href: '/categories/fish', label: 'Fish' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-[var(--primary)] text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-[var(--primary)] transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service Column */}
            <div>
              <h3 className="text-white font-bold mb-6 relative inline-block">
                Customer Service
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[var(--primary)] rounded-full" />
              </h3>
              <ul className="space-y-3">
                {[
                  { href: '/delivery-info', label: 'Delivery Information' },
                  { href: '/returns', label: 'Returns Policy' },
                  { href: '/faq', label: 'FAQ' },
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms & Conditions' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-[var(--primary)] text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-[var(--primary)] transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info Column */}
            <div>
              <h3 className="text-white font-bold mb-6 relative inline-block">
                Contact Us
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[var(--primary)] rounded-full" />
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)] transition-colors">
                    <MapPin className="w-4 h-4 text-[var(--primary)] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Dublin, Ireland</p>
                    <p className="text-gray-500 text-xs">Serving all Dublin areas</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)] transition-colors">
                    <Phone className="w-4 h-4 text-[var(--primary)] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <a
                      href="tel:+35312345678"
                      className="text-white text-sm font-medium hover:text-[var(--primary)] transition-colors"
                    >
                      +353 1 234 5678
                    </a>
                    <p className="text-gray-500 text-xs">Mon-Sat, 9am-6pm</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)] transition-colors">
                    <Mail className="w-4 h-4 text-[var(--primary)] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <a
                      href="mailto:info@deshigrocery.ie"
                      className="text-white text-sm font-medium hover:text-[var(--primary)] transition-colors"
                    >
                      info@deshigrocery.ie
                    </a>
                    <p className="text-gray-500 text-xs">We reply within 24 hours</p>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>

                {/* ─── BOTTOM BAR COPYRIGHT ROW ─── */}
        <div className="w-full border-t border-gray-800 flex justify-center">
          <div className="container-custom w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {currentYear} Deshi Grocery. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="text-sm">We accept</span>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-7 bg-gray-800 rounded flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="w-10 h-7 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400">VISA</span>
                    </div>
                    <div className="w-10 h-7 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400">MC</span>
                    </div>
                  </div>
                </div>
                <span className="hidden md:inline text-gray-700">|</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Shield className="w-3.5 h-3.5" />
                    Halal Certified
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Truck className="w-3.5 h-3.5" />
                    Dublin Delivery
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Fresh Daily
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}


