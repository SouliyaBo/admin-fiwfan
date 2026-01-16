"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Users, Settings, Bell } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        {
            title: "ภาพรวม (Overview)",
            icon: <LayoutDashboard size={20} />,
            href: "/",
        },
        {
            title: "ตรวจสอบการชำระเงิน",
            icon: <Wallet size={20} />,
            href: "/payments",
        },
        {
            title: "จัดการการรายงาน (Reports)",
            icon: <Bell size={20} />,
            href: "/reports",
        },
        {
            title: "จัดการผู้ใช้งาน (Users)",
            icon: <Users size={20} />,
            href: "/users",
        },
        {
            title: "ตั้งค่าระบบ",
            icon: <Settings size={20} />,
            href: "/settings",
        },
        // Add more menu items here as needed
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
            </div>

            <div className="mt-auto space-y-1 border-t border-white/10 pt-6">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 px-3">
                    ตั้งค่า
                </h3>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition text-left">
                    <Settings size={20} className="text-white/50" />
                    <span className="font-medium text-sm">ตั้งค่าระบบ (System Settings)</span>
                </button>
            </div>
        </aside>
    );
}
