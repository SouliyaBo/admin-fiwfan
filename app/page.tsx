"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "../lib/images";
import { API_BASE_URL } from "../lib/constants";
import { Check, ShieldCheck, ExternalLink, LogOut, Loader2, X, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingAgencies, setPendingAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rejection State
  const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; agencyId: string | null }>({
    isOpen: false,
    agencyId: null
  });
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

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
      // Force logout if not admin
      localStorage.clear();
      router.push("/login");
      return;
    }

    setUser(parsedUser);
    fetchPendingAgencies(token);
  }, [router]);

  const fetchPendingAgencies = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/agencies/admin/pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingAgencies(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Approve State
  const [approveDialog, setApproveDialog] = useState<{ isOpen: boolean; agencyId: string | null; agencyName: string }>({
    isOpen: false,
    agencyId: null,
    agencyName: ""
  });

  const handleVerify = (agencyId: string, agencyName: string) => {
    setApproveDialog({
      isOpen: true,
      agencyId,
      agencyName
    });
  };

  const confirmApprove = async () => {
    if (!approveDialog.agencyId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/agencies/admin/${approveDialog.agencyId}/verify`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        // Success
        setApproveDialog({ isOpen: false, agencyId: null, agencyName: "" });
        toast.success("อนุมัติสังกัดเรียบร้อยแล้ว");
      } else {
        toast.error("การอนุมัติล้มเหลว");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const openRejectDialog = (agencyId: string) => {
    setRejectDialog({ isOpen: true, agencyId });
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejectReason.trim() || !rejectDialog.agencyId) return;

    try {
      setIsRejecting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/agencies/admin/${rejectDialog.agencyId}/reject`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      if (res.ok) {
        setRejectReason("");
        toast.success("ปฏิเสธคำขอเรียบร้อยแล้ว");
      } else {
        toast.error("ไม่สามารถปฏิเสธคำขอได้");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" /> Loading Admin Panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      {/* Header removed - moved to Layout/Navbar */}

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">คำขอตรวจสอบ KYC (KYC Requests)</h2>
            <p className="text-white/50 text-sm">ตรวจสอบและอนุมัติคำขอสังกัดโมเดลลิ่ง</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-500/20">
              รอตรวจสอบ {pendingAgencies.length} รายการ
            </span>
          </div>
        </div>

        {pendingAgencies.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10 text-white/30 flex flex-col items-center">
            <ShieldCheck size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">ไม่มีคำขอที่รอตรวจสอบ</p>
            <p className="text-sm mt-1">โมเดลลิ่งทั้งหมดได้รับการตรวจสอบแล้ว</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingAgencies.map((agency) => (
              <div key={agency._id} className="bg-[#1e1b4b]/30 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-white/20 transition group">
                <div className="w-20 h-20 bg-black/40 rounded-xl relative overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-white/20 transition">
                  {agency.logoUrl ? (
                    <Image src={getImageUrl(agency.logoUrl)} fill className="object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/30">No Logo</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                    {agency.name}
                    {agency.website && (
                      <a href={agency.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-md no-underline ml-2">
                        <ExternalLink size={10} /> เว็บไซต์
                      </a>
                    )}
                  </h3>
                  <p className="text-white/60 text-sm mt-1 mb-2 line-clamp-2 max-w-2xl">{agency.description || "ไม่มีคำอธิบาย"}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/40 font-mono">
                    <span className="flex items-center gap-1">LINE: <span className="text-white/70">{agency.lineId || "-"}</span></span>
                    <span className="flex items-center gap-1">โทร: <span className="text-white/70">{agency.phone || "-"}</span></span>
                    <span className="flex items-center gap-1">ลงทะเบียน: <span className="text-white/70">{new Date(agency.createdAt).toLocaleDateString('th-TH')}</span></span>
                  </div>
                </div>
                <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 flex flex-col gap-2">
                  <button
                    onClick={() => handleVerify(agency._id, agency.name)}
                    className="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition transform active:scale-95 border border-green-500/50"
                  >
                    <Check size={18} /> อนุมัติ (Approve)
                  </button>
                  <button
                    onClick={() => openRejectDialog(agency._id)}
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

      {/* Rejection Modal */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-4">
              <AlertTriangle className="text-red-500" /> ปฏิเสธคำขอ (Reject Agency)
            </h3>
            <p className="text-white/60 text-sm mb-4">
              กรุณาระบุเหตุผลในการปฏิเสธคำขอสังกัดนี้ ข้อความนี้จะถูกส่งแจ้งเตือนไปยังเจ้าของสังกัด
            </p>

            <textarea
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 min-h-[120px]"
              placeholder="ระบุเหตุผล (เช่น เอกสารไม่ถูกต้อง, โลโก้ไม่ชัดเจน...)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectDialog({ isOpen: false, agencyId: null })}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition"
                disabled={isRejecting}
              >
                ยกเลิก
              </button>
              <button
                onClick={submitReject}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                disabled={isRejecting || !rejectReason.trim()}
              >
                {isRejecting ? <Loader2 className="animate-spin" /> : "ยืนยันการปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-6 mt-2">
              <ShieldCheck className="text-green-500" size={28} /> อนุมัติสังกัด (Approve Agency)
            </h3>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <p className="text-white/80 text-center font-medium">
                ยืนยันการอนุมัติสังกัด <br />
                <span className="text-green-400 font-bold text-lg">"{approveDialog.agencyName}"</span>
              </p>
            </div>

            <p className="text-white/60 text-sm text-center mb-6">
              เมื่ออนุมัติแล้ว สังกัดนี้จะสามารถรับสมาชิกเข้าสังกัดได้ทันที <br />
              และจะแสดงสัญลักษณ์ <ShieldCheck size={14} className="inline text-blue-400" /> Verified
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setApproveDialog({ isOpen: false, agencyId: null, agencyName: "" })}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmApprove}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
              >
                <Check size={20} /> ยืนยันอนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
