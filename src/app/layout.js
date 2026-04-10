import "./globals.css";
import { AppProvider } from "../components/app-provider";

// Keep the app metadata aligned with the current CSE 310 Module #3 submission.
export const metadata = {
  title: "WiseAnchor",
  description: "A daily routine support web app built for the CSE 310 Web Apps module.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
