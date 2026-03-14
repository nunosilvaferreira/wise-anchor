import "./globals.css";

export const metadata = {
  title: "WiseAnchor",
  description: "A simple daily routine helper built for Week 02 of CSE 310.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
