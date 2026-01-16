"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/constants";
import { getImageUrl } from "../../lib/images";
import { Search, ShieldAlert, CheckCircle, Ban, Loader2, User as UserIcon, Shield } from "lucide-react";

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        // Auth check
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (!token || !storedUser) {
            router.push("/login");
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'ADMIN') {
            router.push("/login");
            return;
        }

        fetchUsers();
    }, [page, search]); // Re-fetch when page or search changes (debounce search in real app, simplistic here)

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                search: search
            });

            const res = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (user: any) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะ ${user.isActive ? 'ระงับการใช้งาน (BAN)' : 'เปิดการใช้งาน (ACTIVATE)'} ผู้ใช้นี้?`)) return;

        try {
            setProcessingId(user._id);
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/users/${user._id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !user.isActive })
            });

            if (res.ok) {
                // Update local state
                setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setProcessingId(null);
        }
    };

    const toggleCreatorVerification = async (userId: string, creatorProfile: any) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะ ${creatorProfile.isVerified ? 'ยกเลิกการยืนยัน (UN-VERIFY)' : 'ยืนยัน (VERIFY)'} ครีเอเตอร์คนนี้?`)) return;

        try {
            setProcessingId(userId); // Use userId for loading state key
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/creators/${creatorProfile._id}/verification`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ isVerified: !creatorProfile.isVerified })
            });

            if (res.ok) {
                // Update local state
                setUsers(prev => prev.map(u => {
                    if (u._id === userId) {
                        return {
                            ...u,
                            creatorProfile: { ...u.creatorProfile, isVerified: !creatorProfile.isVerified }
                        };
                    }
                    return u;
                }));
            }
        } catch (error) {
            console.error("Failed to update verification", error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans">
            <main className="container mx-auto px-6 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <UserIcon className="text-blue-500" /> จัดการผู้ใช้งาน (User Management)
                        </h2>
                        <p className="text-white/50 text-sm">จัดการข้อมูลสมาชิก, ระงับการใช้งาน, และตรวจสอบสถานะครีเอเตอร์</p>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหาด้วย ชื่อผู้ใช้, อีเมล, หรือ Line ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#1e1b4b]/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
                ) : (
                    <div className="bg-[#1e1b4b]/30 border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">ผู้ใช้งาน</th>
                                    <th className="p-4 font-medium">ระดับ (Role)</th>
                                    <th className="p-4 font-medium">สถานะ (Login)</th>
                                    <th className="p-4 font-medium">สถานะครีเอเตอร์</th>
                                    <th className="p-4 font-medium">วันที่เข้าร่วม</th>
                                    <th className="p-4 font-medium text-right">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/5 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-black/40 overflow-hidden flex items-center justify-center border border-white/10">
                                                    {user.avatarUrl ? (
                                                        <img src={getImageUrl(user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon size={16} className="text-white/30" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{user.displayName || user.username}</div>
                                                    <div className="text-xs text-white/40">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : user.role === 'CREATOR' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.isActive ? (
                                                <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><CheckCircle size={12} /> ปกติ</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 text-xs font-bold"><Ban size={12} /> ถูกแบน</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {user.role === 'CREATOR' && user.creatorProfile && (
                                                <div className="flex items-center gap-2">
                                                    {user.creatorProfile.isVerified ? (
                                                        <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Verified</span>
                                                    ) : (
                                                        <span className="text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">Hidden / Unverified</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-white/40 font-mono">
                                            {new Date(user.createdAt).toLocaleDateString('th-TH')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    disabled={processingId === user._id || user.role === 'ADMIN'}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${user.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                                >
                                                    {user.isActive ? 'Ban User' : 'Unban User'}
                                                </button>

                                                {user.role === 'CREATOR' && user.creatorProfile && (
                                                    <button
                                                        onClick={() => toggleCreatorVerification(user._id, user.creatorProfile)}
                                                        disabled={processingId === user._id}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${user.creatorProfile.isVerified ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}
                                                    >
                                                        {user.creatorProfile.isVerified ? 'Hide Profile' : 'Show Profile'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {users.length === 0 && !loading && (
                            <div className="text-center py-12 text-white/30 text-sm">ไม่พบรายชื่อผู้ใช้งาน</div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
