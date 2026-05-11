import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "FlashAI — AI-Powered Flashcards",
  description: "Generate smart flashcards from any text or PDF with spaced repetition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="grain min-h-screen">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              color: "#f5f0e8",
              border: "1px solid #3a3a4e",
              fontFamily: "'DM Sans', sans-serif",
            },
            success: {
              iconTheme: { primary: "#c8f135", secondary: "#1a1a2e" },
            },
          }}
        />
      </body>
    </html>
  );
}
