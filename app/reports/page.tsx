"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, PORTAL_URL } from "../../lib/constants";
import { getImageUrl } from "../../lib/images";
import { Check, ShieldCheck, X, Loader2 } from "lucide-react";

export default function ReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
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

        fetchReports(token);
    }, [router]);

    const fetchReports = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/reports`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            } else {
                const err = await res.json();
                console.error("Fetch error:", err);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const updateReportStatus = async (id: string, status: string, action?: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status, action })
            });

            if (res.ok) {
                setActionModalOpen(false);
                setSelectedReport(null);
                if (token) fetchReports(token);
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-white/50" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans">
            <main className="container mx-auto px-6 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <ShieldCheck className="text-[#F84E6E]" /> จัดการการรายงาน (Reports)
                        </h2>
                        <p className="text-white/50 text-sm">ตรวจสอบและจัดการรายงานปัญหาจากผู้ใช้งาน</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-sm font-bold border border-red-500/20">
                            {reports.filter((r: any) => r.status === 'PENDING').length} รอดำเนินการ
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-[#F84E6E]" /></div>
                ) : (
                    <div className="bg-[#1e1b4b]/30 border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">วันที่</th>
                                    <th className="p-4 font-medium">สถานะ</th>
                                    <th className="p-4 font-medium">ผู้แจ้ง</th>
                                    <th className="p-4 font-medium">ประเภท</th>
                                    <th className="p-4 font-medium">เป้าหมาย (Target)</th>
                                    <th className="p-4 font-medium">รายละเอียด</th>
                                    <th className="p-4 font-medium table-cell">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {reports.map((report) => (
                                    <tr key={report._id} className="hover:bg-white/5 transition">
                                        <td className="p-4 text-xs text-white/40 font-mono">
                                            {new Date(report.createdAt).toLocaleDateString('th-TH')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${report.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                report.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {report.status === 'PENDING' ? 'รอดำเนินการ' : report.status === 'RESOLVED' ? 'แก้ไขแล้ว' : 'ปฏิเสธ'}
                                            </span>
                                            {report.adminNote && (
                                                <div className="text-[10px] text-white/30 mt-1 italic max-w-[150px]">
                                                    {report.adminNote}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-white/80">
                                                {report.reporter?.displayName || report.reporter?.username || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono text-white/60">
                                            {report.targetType}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                                    {(
                                                        // Check for User/Creator Avatar
                                                        (report.targetType !== 'REVIEW' && (report.target?.avatarUrl || (report.target?.images && report.target?.images[0]))) ||
                                                        // Check for Review Author Avatar
                                                        (report.targetType === 'REVIEW' && report.target?.user?.avatarUrl)
                                                    ) ? (
                                                        <img
                                                            src={getImageUrl(
                                                                report.targetType === 'REVIEW'
                                                                    ? report.target.user.avatarUrl
                                                                    : (report.target?.avatarUrl || report.target?.images?.[0])
                                                            )}
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">No Pic</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="text-sm text-white/90 font-bold">
                                                        {report.targetType === 'REVIEW' && report.target?.user ?
                                                            (report.target.user.displayName || report.target.user.username) :
                                                            (report.target?.displayName || report.target?.username || "Unknown")
                                                        }
                                                    </div>
                                                    <div className="text-xs text-white/50 mb-1">
                                                        {report.targetType}
                                                        {report.targetType === 'REVIEW' && <span className="text-white/30 ml-1">(Review)</span>}
                                                    </div>

                                                    {/* Link to Profile */}
                                                    {report.targetType === 'REVIEW' && (
                                                        <a
                                                            href={`${PORTAL_URL}/sideline/${report.target.user._id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded hover:bg-blue-500/30 transition flex items-center gap-1 w-fit"
                                                        >
                                                            ดูโปรไฟล์ <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold">
                                                {
                                                    {
                                                        "Inappropriate Content": "รูปภาพ/เนื้อหาไม่เหมาะสม",
                                                        "Fake Profile": "โปรไฟล์ปลอม/หลอกลวง",
                                                        "Harassment": "การคุกคาม/รบกวน",
                                                        "Spam": "สแปม/โฆษณา",
                                                        "Other": "อื่นๆ"
                                                    }[report.reason as string] || report.reason
                                                }
                                            </div>
                                            {report.description && <div className="text-xs text-white/50 mt-1">{report.description}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {report.targetType === 'CREATOR' && (
                                                    <a
                                                        href={`${API_BASE_URL.replace('/api', '')}/sideline/${report.targetId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition"
                                                        title="ไปที่หน้าโปรไฟล์"
                                                    >
                                                        <Loader2 size={16} className={loading ? "animate-spin" : "hidden"} />
                                                        {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                                                    </a>
                                                )}

                                                {report.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReport(report);
                                                            setActionModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 rounded bg-[#F84E6E] text-white text-xs font-bold hover:bg-[#d43f5b] transition shadow-lg shadow-pink-500/20"
                                                    >
                                                        จัดการ (Action)
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* ACTION MODAL */}
            {actionModalOpen && selectedReport && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck className="text-[#F84E6E]" /> จัดการการรายงาน (Manage Report)
                        </h3>

                        <div className="bg-white/5 p-4 rounded-xl mb-6 text-sm text-white/70">
                            คุณกำลังจัดการรายงานของ: <span className="text-white font-bold">{selectedReport.target?.displayName || selectedReport.target?.username || "Unknown"}</span>
                            <br />
                            ข้อหา: <span className="text-white font-bold">{
                                {
                                    "Inappropriate Content": "รูปภาพ/เนื้อหาไม่เหมาะสม",
                                    "Fake Profile": "โปรไฟล์ปลอม/หลอกลวง",
                                    "Harassment": "การคุกคาม/รบกวน",
                                    "Spam": "สแปม/โฆษณา",
                                    "Other": "อื่นๆ"
                                }[selectedReport.reason as string] || selectedReport.reason
                            }</span>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => updateReportStatus(selectedReport._id, 'RESOLVED', 'HIDE_PROFILE')}
                                className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ซ่อนโปรไฟล์ (Soft Ban)
                            </button>

                            <button
                                onClick={() => updateReportStatus(selectedReport._id, 'RESOLVED', 'BAN_USER')}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                ระงับการใช้งาน (Hard Ban)
                            </button>

                            <div className="h-px bg-white/10 my-2"></div>

                            <button
                                onClick={() => updateReportStatus(selectedReport._id, 'RESOLVED')}
                                className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> รับทราบ / แก้ไขแล้ว (ไม่ลงโทษ)
                            </button>

                            <button
                                onClick={() => updateReportStatus(selectedReport._id, 'REJECTED')}
                                className="w-full bg-white/5 hover:bg-white/10 text-white/50 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                <X size={18} /> ยกฟ้อง (Dismiss)
                            </button>
                        </div>

                        <button
                            onClick={() => setActionModalOpen(false)}
                            className="mt-4 w-full text-center text-xs text-white/30 hover:text-white transition"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
