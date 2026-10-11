import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Workspace } from "../components/Workspace";
export const metadata: Metadata = {
  title: "Alec's × ScaleSight",
  description:
    "Retail signals, reviewed against production, components and cash.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense
          fallback={
            <div className="loading">
              Alec’s × ScaleSight · Retail-to-Production Planning
            </div>
          }
        >
          <Workspace>{children}</Workspace>
        </Suspense>
      </body>
    </html>
  );
}
