import { AppProviders } from "./providers";
import "./globals.css";
import "@/components/landing/landing.css";

export const metadata = {
  title: "Kantin — Campus Food, Made Easy",
  description: "Discover campus cafeterias, explore menus, and order with ease using Kantin.",
  icons: { icon: "/kantin-mark.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
