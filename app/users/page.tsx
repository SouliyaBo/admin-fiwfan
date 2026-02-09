"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, PORTAL_URL } from "../../lib/constants";
import { getImageUrl } from "../../lib/images";
import { Search, ShieldAlert, CheckCircle, Ban, Loader2, User as UserIcon, Shield, X, Eye, Image as ImageIcon, ExternalLink } from "lucide-react";

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<'CREATOR' | 'USER' | 'ADMIN'>('CREATOR');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [kycReviewUser, setKycReviewUser] = useState<any>(null); // User currently being reviewed

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
    }, [page, search, activeTab]); // Re-fetch when page, search, or tab changes

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "20", // Pagination per tab
                search: search,
                role: activeTab // Filter by active tab role
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

    const [banConfirmDialog, setBanConfirmDialog] = useState<{ isOpen: boolean; user: any | null }>({
        isOpen: false,
        user: null
    });

    const toggleUserStatus = (user: any) => {
        setBanConfirmDialog({ isOpen: true, user });
    };

    const handleConfirmBan = async () => {
        const { user } = banConfirmDialog;
        if (!user) return;

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
                setBanConfirmDialog({ isOpen: false, user: null });
            }
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setProcessingId(null);
        }
    };

    const [verifyConfirmDialog, setVerifyConfirmDialog] = useState<{ isOpen: boolean; userId: string | null; creatorProfile: any | null }>({
        isOpen: false,
        userId: null,
        creatorProfile: null
    });

    const toggleCreatorVerification = (userId: string, creatorProfile: any) => {
        setVerifyConfirmDialog({ isOpen: true, userId, creatorProfile });
    };

    const handleConfirmVerification = async () => {
        const { userId, creatorProfile } = verifyConfirmDialog;
        if (!userId || !creatorProfile) return;

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
                setVerifyConfirmDialog({ isOpen: false, userId: null, creatorProfile: null });
            }
        } catch (error) {
            console.error("Failed to update verification", error);
        } finally {
            setProcessingId(null);
        }
    };

    const [kycConfirmDialog, setKycConfirmDialog] = useState<{ isOpen: boolean; status: 'APPROVED' | 'REJECTED' | null }>({
        isOpen: false,
        status: null
    });

    const handleKycAction = (status: 'APPROVED' | 'REJECTED') => {
        setKycConfirmDialog({ isOpen: true, status });
    };

    const handleConfirmKyc = async () => {
        const { status } = kycConfirmDialog;
        if (!kycReviewUser || !status) return;
        const userId = kycReviewUser._id;
        const creatorId = kycReviewUser.creatorProfile._id;

        try {
            setProcessingId(userId);
            const token = localStorage.getItem("token");

            // 1. Update verificationStatus
            const res = await fetch(`${API_BASE_URL}/creators/${creatorId}/verification`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    verificationStatus: status,
                    isVerified: status === 'APPROVED'
                })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => {
                    if (u._id === userId) {
                        return {
                            ...u,
                            creatorProfile: {
                                ...u.creatorProfile,
                                verificationStatus: status,
                                isVerified: status === 'APPROVED'
                            }
                        };
                    }
                    return u;
                }));
                setKycConfirmDialog({ isOpen: false, status: null });
                setKycReviewUser(null); // Close modal
            }
        } catch (error) {
            console.error("Failed to update KYC status", error);
        } finally {
            setProcessingId(null);
        }
    };

    const [selectedUser, setSelectedUser] = useState<any>(null); // For viewing details

    // ... existing functions ...

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

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-white/10">
                    <button
                        onClick={() => { setActiveTab('CREATOR'); setPage(1); }}
                        className={`px-4 py-3 font-bold text-sm transition relative ${activeTab === 'CREATOR' ? 'text-pink-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Creators
                        {activeTab === 'CREATOR' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-400"></div>}
                    </button>
                    <button
                        onClick={() => { setActiveTab('USER'); setPage(1); }}
                        className={`px-4 py-3 font-bold text-sm transition relative ${activeTab === 'USER' ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Users (Tourists)
                        {activeTab === 'USER' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>}
                    </button>
                    <button
                        onClick={() => { setActiveTab('ADMIN'); setPage(1); }}
                        className={`px-4 py-3 font-bold text-sm transition relative ${activeTab === 'ADMIN' ? 'text-red-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Admins
                        {activeTab === 'ADMIN' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-400"></div>}
                    </button>
                </div>

                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input
                        type="text"
                        placeholder={`ค้นหา ${activeTab === 'CREATOR' ? 'ครีเอเตอร์' : activeTab === 'USER' ? 'ผู้ใช้งาน' : 'แอดมิน'}...`}
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
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-1.5 rounded text-xs font-bold transition flex items-center gap-1 bg-white/5 text-white hover:bg-white/10"
                                                    title="ดูรายละเอียด"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {user.role === 'CREATOR' && user.creatorProfile && (
                                                    <a
                                                        href={`${PORTAL_URL}/sideline/${user.creatorProfile._id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded text-xs font-bold transition flex items-center gap-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                                        title="ดูหน้าโปรไฟล์ (Portal)"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    disabled={processingId === user._id || user.role === 'ADMIN'}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${user.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                                >
                                                    {user.isActive ? 'Ban' : 'Unban'}
                                                </button>

                                                {user.role === 'CREATOR' && user.creatorProfile && (
                                                    <button
                                                        onClick={() => toggleCreatorVerification(user._id, user.creatorProfile)}
                                                        disabled={processingId === user._id || user.creatorProfile.verificationStatus === 'PENDING'}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${user.creatorProfile.isVerified ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'} ${user.creatorProfile.verificationStatus === 'PENDING' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {user.creatorProfile.isVerified ? 'Hide' : 'Show'}
                                                    </button>
                                                )}

                                                {user.role === 'CREATOR' && user.creatorProfile?.verificationStatus === 'PENDING' && (
                                                    <button
                                                        onClick={() => setKycReviewUser(user)}
                                                        className="px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 bg-orange-500 text-white hover:bg-orange-600 animate-pulse"
                                                    >
                                                        <ShieldAlert size={14} /> Review
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

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#1e1b4b] z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white">รายละเอียดผู้ใช้งาน (User Details)</h3>
                                <div className="flex items-center gap-2 text-white/60 text-sm">
                                    <span>ID: {selectedUser._id}</span>
                                    <span className="text-white/20">|</span>
                                    <span>Joined: {new Date(selectedUser.createdAt).toLocaleDateString('th-TH')}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* LEFT COLUMN: BASIC INFO & GALLERY */}
                                <div className="col-span-1 md:col-span-4 space-y-6">
                                    {/* Avatar & Main Info */}
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center relative overflow-hidden">
                                        <div className="w-32 h-32 rounded-full bg-black/40 overflow-hidden border-4 border-white/10 mx-auto mb-4">
                                            {selectedUser.avatarUrl ? (
                                                <img src={getImageUrl(selectedUser.avatarUrl)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full"><UserIcon size={48} className="text-white/30" /></div>
                                            )}
                                        </div>
                                        <h4 className="text-2xl font-bold text-white mb-1">{selectedUser.displayName || selectedUser.username}</h4>
                                        <p className="text-white/40 text-sm mb-3">@{selectedUser.username}</p>

                                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedUser.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : selectedUser.role === 'CREATOR' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {selectedUser.role}
                                            </span>
                                            {selectedUser.isActive ? (
                                                <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Active</span>
                                            ) : (
                                                <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Banned</span>
                                            )}
                                            {selectedUser.creatorProfile?.isVerified && (
                                                <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Verified</span>
                                            )}
                                        </div>

                                        <div className="space-y-3 text-left bg-black/20 rounded-xl p-4 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-white/40">Email</span>
                                                <span className="text-white">{selectedUser.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/40">Phone</span>
                                                <span className="text-white">{selectedUser.phoneNumber || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/40">Line ID</span>
                                                <span className="text-white">{selectedUser.lineId || "-"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gallery Preview */}
                                    {selectedUser.role === 'CREATOR' && selectedUser.creatorProfile && (
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                            <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                                                <ImageIcon size={16} className="text-pink-400" /> แกลเลอรี ({selectedUser.creatorProfile.images?.length || 0})
                                            </h5>
                                            {selectedUser.creatorProfile.images && selectedUser.creatorProfile.images.length > 0 ? (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {selectedUser.creatorProfile.images.slice(0, 9).map((img: string, idx: number) => (
                                                        <a key={idx} href={getImageUrl(img)} target="_blank" className="aspect-square rounded-lg overflow-hidden bg-black/40 border border-white/10 hover:border-pink-500 transition">
                                                            <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
                                                        </a>
                                                    ))}
                                                    {selectedUser.creatorProfile.images.length > 9 && (
                                                        <div className="aspect-square rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/50">
                                                            +{selectedUser.creatorProfile.images.length - 9}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-white/30 text-center text-sm py-4">ไม่มีรูปภาพ</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT COLUMN: CREATOR DETAILS */}
                                <div className="col-span-1 md:col-span-8 space-y-6">
                                    {selectedUser.role === 'CREATOR' && selectedUser.creatorProfile ? (
                                        <>
                                            {/* About & Stats */}
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                                <h4 className="text-lg font-bold text-pink-400 mb-6 flex items-center gap-2">
                                                    <Shield size={18} /> ข้อมูลครีเอเตอร์ (Creator Profile)
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    <div className="space-y-4">
                                                        <h5 className="font-bold text-white text-sm border-b border-white/10 pb-2">ข้อมูลส่วนตัว</h5>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <InfoItem label="ชื่อแสดงผล" value={selectedUser.creatorProfile.displayName || "-"} />
                                                            <InfoItem label="อายุ" value={selectedUser.creatorProfile.age ? `${selectedUser.creatorProfile.age} ปี` : "-"} />
                                                            <InfoItem label="เพศ" value={selectedUser.creatorProfile.gender || "-"} />
                                                            <InfoItem label="จังหวัด" value={selectedUser.creatorProfile.province || "-"} />
                                                            <InfoItem label="ราคาเริ่มต้น" value={selectedUser.creatorProfile.price ? `฿${selectedUser.creatorProfile.price.toLocaleString()}` : "-"} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h5 className="font-bold text-white text-sm border-b border-white/10 pb-2">สัดส่วนร่างกาย</h5>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <InfoItem label="ส่วนสูง" value={selectedUser.creatorProfile.height ? `${selectedUser.creatorProfile.height} cm` : "-"} />
                                                            <InfoItem label="น้ำหนัก" value={selectedUser.creatorProfile.weight ? `${selectedUser.creatorProfile.weight} kg` : "-"} />
                                                            <InfoItem label="สัดส่วน (B-W-H)" value={selectedUser.creatorProfile.measurements ||
                                                                ((selectedUser.creatorProfile.chest || selectedUser.creatorProfile.waist || selectedUser.creatorProfile.hips) ?
                                                                    `${selectedUser.creatorProfile.chest || "?"}-${selectedUser.creatorProfile.waist || "?"}-${selectedUser.creatorProfile.hips || "?"}` : "-")} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-6">
                                                    <h5 className="font-bold text-white text-sm">แนะนำตัว (Bio)</h5>
                                                    <div className="bg-black/20 rounded-xl p-4 text-white/80 text-sm whitespace-pre-line border border-white/5">
                                                        {selectedUser.creatorProfile.bio || "ไม่มีข้อมูลแนะนำตัว"}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-6">
                                                    <h5 className="font-bold text-white text-sm">ช่องทางติดต่อเพิ่มเติม</h5>
                                                    <div className="flex gap-4 flex-wrap">
                                                        {selectedUser.creatorProfile.lineId && (
                                                            <div className="bg-[#06C755]/10 text-[#06C755] px-3 py-1.5 rounded-lg text-sm font-bold border border-[#06C755]/20">
                                                                Line: {selectedUser.creatorProfile.lineId}
                                                            </div>
                                                        )}
                                                        {selectedUser.creatorProfile.whatsapp && (
                                                            <div className="bg-[#25D366]/10 text-[#25D366] px-3 py-1.5 rounded-lg text-sm font-bold border border-[#25D366]/20">
                                                                WhatsApp: {selectedUser.creatorProfile.whatsapp}
                                                            </div>
                                                        )}
                                                        {selectedUser.creatorProfile.instagram && (
                                                            <div className="bg-[#E1306C]/10 text-[#E1306C] px-3 py-1.5 rounded-lg text-sm font-bold border border-[#E1306C]/20">
                                                                IG: {selectedUser.creatorProfile.instagram}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Services / Tags */}
                                                {selectedUser.creatorProfile.services && selectedUser.creatorProfile.services.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h5 className="font-bold text-white text-sm">บริการ (Services)</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedUser.creatorProfile.services.map((tag: string, i: number) => (
                                                                <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Packages */}
                                            {selectedUser.creatorProfile.packages && selectedUser.creatorProfile.packages.length > 0 && (
                                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                        <CheckCircle size={18} className="text-green-400" /> แพ็กเกจงาน (Packages)
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {selectedUser.creatorProfile.packages.map((pkg: any, idx: number) => (
                                                            <div key={idx} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                                                <div>
                                                                    <div className="text-pink-400 font-bold mb-1">฿{pkg.price ? pkg.price.toLocaleString() : "-"}</div>
                                                                    <div className="text-white text-sm">{pkg.details || "-"}</div>
                                                                    <div className="text-xs text-white/40 mt-1">ระยะเวลา: {pkg.time || "-"}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* KYC Documents */}
                                            {selectedUser.creatorProfile.verificationData && (
                                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                        <ShieldAlert size={18} className="text-yellow-400" /> เอกสารยืนยันตัวตน (KYC)
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <span className="text-xs text-white/50">รูปคู่รหัส</span>
                                                            {selectedUser.creatorProfile.verificationData.photoWithCodeUrl ? (
                                                                <a href={getImageUrl(selectedUser.creatorProfile.verificationData.photoWithCodeUrl)} target="_blank" className="block aspect-[3/4] bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-yellow-400 transition">
                                                                    <img src={getImageUrl(selectedUser.creatorProfile.verificationData.photoWithCodeUrl)} className="w-full h-full object-contain" />
                                                                </a>
                                                            ) : <div className="text-white/30 text-sm">N/A</div>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <span className="text-xs text-white/50">รูปเต็มตัว</span>
                                                            {selectedUser.creatorProfile.verificationData.fullBodyPhotoUrl ? (
                                                                <a href={getImageUrl(selectedUser.creatorProfile.verificationData.fullBodyPhotoUrl)} target="_blank" className="block aspect-[3/4] bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-yellow-400 transition">
                                                                    <img src={getImageUrl(selectedUser.creatorProfile.verificationData.fullBodyPhotoUrl)} className="w-full h-full object-contain" />
                                                                </a>
                                                            ) : <div className="text-white/30 text-sm">N/A</div>}
                                                        </div>
                                                        {/* ID Card if needed */}
                                                        {selectedUser.creatorProfile.verificationData.idCardUrl && (
                                                            <div className="space-y-2 col-span-2">
                                                                <span className="text-xs text-white/50">บัตรประชาชน</span>
                                                                <a href={getImageUrl(selectedUser.creatorProfile.verificationData.idCardUrl)} target="_blank" className="block h-32 bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-yellow-400 transition">
                                                                    <img src={getImageUrl(selectedUser.creatorProfile.verificationData.idCardUrl)} className="w-full h-full object-contain" />
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="bg-white/5 rounded-2xl p-12 text-center text-white/30 border border-white/5">
                                            <UserIcon size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>ผู้ใช้นี้ไม่ใช่ Creator หรือยังไม่มีข้อมูลโปรไฟล์</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* KYC Review Modal */}
            {kycReviewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#1e1b4b] z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white">ตรวจสอบยืนยันตัวตน (KYC Review)</h3>
                                <p className="text-white/60 text-sm">ผู้ใช้งาน: <span className="text-white font-bold">{kycReviewUser.displayName || kycReviewUser.username}</span></p>
                            </div>
                            <button onClick={() => setKycReviewUser(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">1. รูปถ่ายคู่กับรหัส (Photo with Code)</h4>
                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-black/50 mx-auto">
                                        {kycReviewUser.creatorProfile?.verificationData?.photoWithCodeUrl ? (
                                            <a href={getImageUrl(kycReviewUser.creatorProfile.verificationData.photoWithCodeUrl)} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={getImageUrl(kycReviewUser.creatorProfile.verificationData.photoWithCodeUrl)}
                                                    className="w-full h-full object-contain hover:scale-105 transition duration-500"
                                                    alt="With Code"
                                                />
                                            </a>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-white/30">No Image</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">2. รูปถ่ายเต็มตัว (Full Body)</h4>
                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-black/50 mx-auto">
                                        {kycReviewUser.creatorProfile?.verificationData?.fullBodyPhotoUrl ? (
                                            <a href={getImageUrl(kycReviewUser.creatorProfile.verificationData.fullBodyPhotoUrl)} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={getImageUrl(kycReviewUser.creatorProfile.verificationData.fullBodyPhotoUrl)}
                                                    className="w-full h-full object-contain hover:scale-105 transition duration-500"
                                                    alt="Full Body"
                                                />
                                            </a>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-white/30">No Image</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-[#1e1b4b] sticky bottom-0 z-10 flex justify-end gap-4">
                            <button
                                onClick={() => handleKycAction('REJECTED')}
                                className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition flex items-center gap-2"
                            >
                                <Ban size={18} /> ปฏิเสธ (Reject)
                            </button>
                            <button
                                onClick={() => handleKycAction('APPROVED')}
                                className="px-6 py-3 bg-green-500 text-black hover:bg-green-400 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-green-500/20"
                            >
                                <CheckCircle size={18} /> อนุมัติ (Approve)
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Ban Confirm Modal */}
            {banConfirmDialog.isOpen && banConfirmDialog.user && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-4 text-center">ยืนยันการเปลี่ยนสถานะ</h3>
                        <p className="text-white/70 text-center mb-8">
                            คุณแน่ใจหรือไม่ที่จะ <span className={`font-bold ${banConfirmDialog.user.isActive ? 'text-red-400' : 'text-green-400'}`}>
                                {banConfirmDialog.user.isActive ? 'ระงับการใช้งาน (BAN)' : 'เปิดการใช้งาน (ACTIVATE)'}
                            </span> ผู้ใช้นี้?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setBanConfirmDialog({ isOpen: false, user: null })}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmBan}
                                className={`flex-1 py-2.5 rounded-xl text-black font-bold transition shadow-lg ${banConfirmDialog.user.isActive ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20' : 'bg-green-500 hover:bg-green-400 shadow-green-500/20'}`}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* KYC Confirm Modal */}
            {kycConfirmDialog.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-4 text-center">ยืนยันการตรวจสอบ</h3>
                        <p className="text-white/70 text-center mb-8">
                            คุณแน่ใจหรือไม่ที่จะ <span className={`font-bold ${kycConfirmDialog.status === 'APPROVED' ? 'text-green-400' : 'text-red-400'}`}>
                                {kycConfirmDialog.status === 'APPROVED' ? 'อนุมัติ (APPROVE)' : 'ปฏิเสธ (REJECT)'}
                            </span> คำขอนี้?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setKycConfirmDialog({ isOpen: false, status: null })}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmKyc}
                                className={`flex-1 py-2.5 rounded-xl text-black font-bold transition shadow-lg ${kycConfirmDialog.status === 'APPROVED' ? 'bg-green-500 hover:bg-green-400 shadow-green-500/20' : 'bg-red-500 hover:bg-red-400 shadow-red-500/20'}`}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Confirm Modal */}
            {verifyConfirmDialog.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-4 text-center">ยืนยันการเปลี่ยนสถานะ</h3>
                        <p className="text-white/70 text-center mb-8">
                            คุณแน่ใจหรือไม่ที่จะ <span className={`font-bold ${verifyConfirmDialog.creatorProfile.isVerified ? 'text-red-400' : 'text-green-400'}`}>
                                {verifyConfirmDialog.creatorProfile.isVerified ? 'ยกเลิกการยืนยัน (UN-VERIFY)' : 'ยืนยัน (VERIFY)'}
                            </span> ครีเอเตอร์คนนี้?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setVerifyConfirmDialog({ isOpen: false, userId: null, creatorProfile: null })}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmVerification}
                                className={`flex-1 py-2.5 rounded-xl text-black font-bold transition shadow-lg ${verifyConfirmDialog.creatorProfile.isVerified ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20' : 'bg-green-500 hover:bg-green-400 shadow-green-500/20'}`}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoItem({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <span className="text-xs text-white/40 block mb-1">{label}</span>
            <span className="text-white font-medium break-all">{value}</span>
        </div>
    );
}
