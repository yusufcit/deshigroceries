import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Deshi Grocery - Fresh Halal Meat & Fish Delivery in Dublin",
  description: "Order fresh halal chicken, lamb, beef, and fish online with home delivery in Dublin, Ireland. Premium quality halal groceries at competitive prices.",
  keywords: "halal grocery, halal meat, halal fish, Dublin, Ireland, home delivery, online grocery",
  openGraph: {
    title: "Deshi Grocery - Fresh Halal Meat & Fish Delivery",
    description: "Premium halal groceries delivered to your door in Dublin",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col m-0"> {/* added m-0 safety reset */}
        <Header />
        <main className="w-full flex-1">
          {children} {/* Kept clean so pages can use full-width sections */}
        </main>
        <Footer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
