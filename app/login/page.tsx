"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/constants";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear error

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                // Check Role: Must be ADMIN
                if (data.user.role !== "ADMIN") {
                    setError("ไม่มีสิทธิ์เข้าถึง: สำหรับผู้ดูแลระบบเท่านั้น");
                    return;
                }

                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/");
            } else {
                setError(data.message || "การเข้าสู่ระบบล้มเหลว");
            }
        } catch (err) {
            setError("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1e1b4b] rounded-2xl shadow-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">ระบบจัดการ (Admin Panel)</h1>
                    <p className="text-white/50">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">บัญชีผู้ใช้ (Username)</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-white/30" size={18} />
                            <input
                                type="text"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="กรอกชื่อผู้ใช้"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">รหัสผ่าน (Password)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-white/30" size={18} />
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="กรอกรหัสผ่าน"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
                    >
                        เข้าสู่ระบบ (Sign In)
                    </button>
                </form>
            </div>
        </div>
    );
}
