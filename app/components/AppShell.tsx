"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Adjust paths that should NOT have the layout
    const isPublicPage = pathname === "/login" || pathname === "/register";

    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex flex-1 flex-col lg:flex-row">
                <Sidebar />
                <main className="flex-1 p-6 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
