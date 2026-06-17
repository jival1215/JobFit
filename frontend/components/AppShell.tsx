import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cloud">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
