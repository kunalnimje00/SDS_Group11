import { AppProviders } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Kantin — Campus Food, Made Easy",
  description: "College cafeteria ordering system & student dashboard",
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
