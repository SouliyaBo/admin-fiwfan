"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <nav className="bg-[#1e1b4b] border-b border-white/10 sticky top-0 z-50 h-16">
            <div className="container mx-auto px-6 h-full flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg">
                        <ShieldCheck className="text-blue-400" size={24} />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Admin Panel
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-medium text-white">
                            {user?.displayName || "Admin User"}
                        </span>
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 rounded-full">
                            ผู้ดูแลระบบ (Administrator)
                        </span>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition text-sm font-medium"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">ออกจากระบบ (Logout)</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
