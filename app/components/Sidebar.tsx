"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Wallet, Users, Settings, Bell } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();


    // Load user from localStorage
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [pathname]); // Update when path changes to ensure fresh state if needed

    const menuItems = [
        {
            title: "ภาพรวม (Overview)",
            icon: <LayoutDashboard size={20} />,
            href: "/",
            permission: null // Public for all admins
        },
        {
            title: "ตรวจสอบการชำระเงิน",
            icon: <Wallet size={20} />,
            href: "/payments",
            permission: "manage_payments"
        },
        {
            title: "จัดการการรายงาน (Reports)",
            icon: <Bell size={20} />,
            href: "/reports",
            permission: "manage_reports"
        },
        {
            title: "จัดการผู้ใช้งาน (Users)",
            icon: <Users size={20} />,
            href: "/users",
            permission: "manage_users"
        },
        {
            title: "จัดการแพ็กเกจ (Plans)",
            icon: <Wallet size={20} />,
            href: "/plans",
            permission: "manage_plans"
        },
        {
            title: "ตั้งค่าระบบ",
            icon: <Settings size={20} />,
            href: "/settings",
            permission: "manage_settings"
        },
    ];

    return (
        <aside className="w-full lg:w-72 bg-[#1e1b4b] border-r border-white/10 p-6 flex flex-col gap-6 h-full min-h-[calc(100vh-64px)]">

            {/* Quick Stats or Info */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-white/70 mb-1">สถานะระบบ (System Status)</h3>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-green-400 text-xs font-bold">ทำงานปกติ (Online)</span>
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 px-3">
                    เมนูหลัก
                </h3>
                {menuItems.map((item, index) => {
                    // Filter Logic
                    if (!user) return null; // Wait for load

                    // Check if Super Admin
                    const isSuperAdmin = user.role === 'SUPER_ADMIN';

                    if (!isSuperAdmin && item.permission) {
                        // Check specific permission
                        const hasPermission = user.permissions?.includes(item.permission);
                        if (!hasPermission) return null;
                    }

                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <span className={isActive ? "text-white" : "text-white/50 group-hover:text-white"}>
                                {item.icon}
                            </span>
                            <span className="font-medium text-sm">{item.title}</span>
                        </Link>
                    );
                })}

                {/* Super Admin Only Menu */}
                {user && user.role === 'SUPER_ADMIN' && (
                    <Link
                        href="/admins"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${pathname === "/admins"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <span className={pathname === "/admins" ? "text-white" : "text-white/50 group-hover:text-white"}>
                            <Users size={20} />
                        </span>
                        <span className="font-medium text-sm">จัดการผู้ดูแลระบบ (Admins)</span>
                    </Link>
                )}
            </div>
        </aside>
    );
}
