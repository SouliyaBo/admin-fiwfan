"use client";

import { useState } from "react";
import { API_BASE_URL } from "../../../lib/constants";
import { toast } from "react-toastify";
import { X, Lock, User, ShieldCheck } from "lucide-react";

interface AddAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PERMISSIONS_LIST = [
    { id: "manage_payments", label: "ตรวจสอบการชำระเงิน (Payments)" },
    { id: "manage_reports", label: "จัดการการรายงาน (Reports)" },
    { id: "manage_users", label: "จัดการผู้ใช้งาน (Users)" },
    { id: "manage_plans", label: "จัดการแพ็กเกจ (Plans)" },
    { id: "manage_settings", label: "ตั้งค่าระบบ (Settings)" },
];

export default function AddAdminModal({ isOpen, onClose, onSuccess }: AddAdminModalProps) {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        displayName: "",
        permissions: [] as string[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const togglePermission = (permId: string) => {
        setFormData(prev => {
            const perms = prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: perms };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/admin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Admin created successfully");
                setFormData({ username: "", password: "", displayName: "", permissions: [] });
                onSuccess();
            } else {
                toast.error(data.error || "Failed to create admin");
            }
        } catch (error) {
            toast.error("Error creating admin");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1e1b4b] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">เพิ่มผู้ดูแลระบบ (Add Admin)</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">ชื่อผู้ใช้ (Username)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-white/30" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="admin_username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">ชื่อแสดง (Display Name)</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Admin Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">รหัสผ่าน (Password)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-white/30" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-blue-400" />
                                กำหนดสิทธิ์การเข้าถึง (Permissions)
                            </label>
                            <div className="space-y-2">
                                {PERMISSIONS_LIST.map(perm => (
                                    <label key={perm.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.includes(perm.id)}
                                            onChange={() => togglePermission(perm.id)}
                                            className="w-5 h-5 rounded border-white/20 bg-black/20 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <span className="text-white/80 text-sm">{perm.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
                            >
                                {isSubmitting ? "กำลังบันทึก..." : "บันทึก (Save Admin)"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
