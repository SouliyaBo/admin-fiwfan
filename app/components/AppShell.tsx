"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Loader2 } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    // Adjust paths that should NOT have the layout
    const isPublicPage = pathname === "/login" || pathname === "/register";

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isPublicPage) {
            setIsLoading(false);
            return;
        }

        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            router.replace("/login");
        } else {
            setIsAuthenticated(true);
            setIsLoading(false);
        }
    }, [pathname, isPublicPage, router]);

    if (isPublicPage) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#020617]">
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
