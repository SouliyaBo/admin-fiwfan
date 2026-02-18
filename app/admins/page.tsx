"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../lib/constants";
import { Loader2, Trash2, Shield, Plus, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import AddAdminModal from "./components/AddAdminModal";

interface Admin {
    _id: string;
    username: string;
    role: string;
    permissions: string[];
    displayName?: string;
}

export default function AdminsPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            } else {
                toast.error("Failed to fetch admins");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this admin?")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/admin/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success("Admin deleted successfully");
                fetchAdmins();
            } else {
                toast.error("Failed to delete admin");
            }
        } catch (error) {
            toast.error("Error deleting admin");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">จัดการผู้ดูแลระบบ (Admin Management)</h1>
                    <p className="text-white/50">จัดการสิทธิ์การเข้าถึงและผู้ดูแลระบบทั้งหมด</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
                >
                    <Plus size={18} />
                    เพิ่มแอดมิน (Add Admin)
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {admins.map((admin) => (
                    <div key={admin._id} className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{admin.displayName || admin.username}</h3>
                                <p className="text-white/50 text-sm">@{admin.username}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs border border-purple-500/30">
                                        {admin.role}
                                    </span>
                                    {admin.permissions?.map(p => (
                                        <span key={p} className="bg-white/10 text-white/70 px-2 py-0.5 rounded text-xs border border-white/10">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {admin.role !== 'SUPER_ADMIN' && (
                            <button
                                onClick={() => handleDelete(admin._id)}
                                className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition"
                                title="Delete Admin"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                ))}

                {admins.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                        <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
                        <p>ยังไม่มีผู้ดูแลระบบ (No admins found)</p>
                    </div>
                )}
            </div>

            <AddAdminModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchAdmins();
                }}
            />
        </div>
    );
}
