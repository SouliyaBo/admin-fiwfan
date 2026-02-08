"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "../../lib/images";
import { API_BASE_URL } from "../../lib/constants";
import { Check, ShieldCheck, ExternalLink, LogOut, Loader2, X, AlertTriangle, CreditCard, Eye } from "lucide-react";
import { toast } from "react-toastify";

interface Subscription {
    _id: string;
    user: {
        _id: string;
        displayName: string;
        username: string;
        email: string;
    };
    planType: string;
    price: number;
    status: string;
    slipUrl?: string;
    startDate: string;
    endDate: string;
    createdAt: string;
}

export default function PaymentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [pendingPayments, setPendingPayments] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

    useEffect(() => {
        // Auth Check
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'ADMIN') {
            localStorage.clear();
            router.push("/login");
            return;
        }

        setUser(parsedUser);
        fetchPendingPayments(token);
    }, [router]);

    const fetchPendingPayments = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/payments/admin/pending`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingPayments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (subscriptionId: string) => {
        if (!confirm("ยืนยันการอนุมัติการชำระเงินนี้? (Confirm Approve?)")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/payments/admin/${subscriptionId}/approve`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                setPendingPayments(prev => prev.filter(p => p._id !== subscriptionId));
                toast.success("อนุมัติเรียบร้อย! (Approved Successfully)");
            } else {
                toast.error("เกิดข้อผิดพลาด (Error occurred)");
            }
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ (Connection Error)");
        }
    };

    const handleReject = async (subscriptionId: string) => {
        if (!confirm("ยืนยันการปฏิเสธการชำระเงินนี้? (Confirm Reject?)")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/payments/admin/${subscriptionId}/reject`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                setPendingPayments(prev => prev.filter(p => p._id !== subscriptionId));
                toast.success("ปฏิเสธเรียบร้อย (Rejected Successfully)");
            } else {
                toast.error("เกิดข้อผิดพลาด (Error occurred)");
            }
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ (Connection Error)");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" /> กำลังโหลด...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans">

            <main className="container mx-auto px-6 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">รายการรอตรวจสอบ (Pending Payments)</h2>
                        <p className="text-white/50 text-sm">ตรวจสอบและอนุมัติการชำระเงินของผู้ใช้</p>
                    </div>
                    <span className="bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-500/20">
                        {pendingPayments.length} รายการ
                    </span>
                </div>

                {pendingPayments.length === 0 ? (
                    <div className="text-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10 text-white/30 flex flex-col items-center">
                        <CreditCard size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">ไม่มีรายการรอตรวจสอบ</p>
                        <p className="text-sm mt-1">ทุกการชำระเงินได้รับการตรวจสอบแล้ว</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingPayments.map((payment) => (
                            <div key={payment._id} className="bg-[#1e1b4b]/30 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-start gap-6 hover:border-white/20 transition group">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-white mb-2">
                                        {payment.user.displayName || payment.user.username}
                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">@{payment.user.username}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 mb-4">
                                        <span>แพ็กเกจ: <span className="text-white font-bold">{payment.planType}</span></span>
                                        <span>ราคา: <span className="text-green-400 font-bold">{payment.price} บาท</span></span>
                                        <span>วันที่แจ้ง: <span className="text-white/70">{new Date(payment.createdAt).toLocaleDateString('th-TH')}</span></span>
                                    </div>

                                    {payment.slipUrl && (
                                        <button
                                            onClick={() => setSelectedSlip(payment.slipUrl!)}
                                            className="text-sm bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                        >
                                            <Eye size={16} /> ดูสลิปการโอนเงิน
                                        </button>
                                    )}
                                </div>

                                <div className="flex-shrink-0 w-full md:w-auto flex flex-col gap-2">
                                    <button
                                        onClick={() => handleApprove(payment._id)}
                                        className="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition transform active:scale-95 border border-green-500/50"
                                    >
                                        <Check size={18} /> อนุมัติ (Approve)
                                    </button>
                                    <button
                                        onClick={() => handleReject(payment._id)}
                                        className="w-full md:w-auto px-6 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 hover:text-white rounded-lg font-bold border border-red-500/30 flex items-center justify-center gap-2 transition"
                                    >
                                        <X size={18} /> ปฏิเสธ (Reject)
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Slip Preview Modal */}
            {selectedSlip && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedSlip(null)}>
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">สลิปการโอนเงิน</h3>
                            <button
                                onClick={() => setSelectedSlip(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                            >
                                <X size={20} className="text-white/70" />
                            </button>
                        </div>
                        <div className="bg-black/30 rounded-xl overflow-hidden">
                            <img
                                src={getImageUrl(selectedSlip)}
                                alt="Payment Slip"
                                className="w-full h-auto max-h-[70vh] object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
