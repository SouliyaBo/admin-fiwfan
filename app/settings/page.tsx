"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../lib/constants";
import { Save, Loader2, Send, SettingsIcon } from "lucide-react";

export default function SettingsPage() {
    const [telegramUrl, setTelegramUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings?key=telegram_url`);
            const data = await res.json();
            if (data && data.value) {
                setTelegramUrl(data.value);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    key: "telegram_url",
                    value: telegramUrl,
                    description: "URL for the Telegram community button"
                })
            });

            if (res.ok) {
                alert("บันทึกข้อมูลเรียบร้อยแล้ว (Saved successfully)");
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึก (Failed to save)");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Connection error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-white">
                <Loader2 className="animate-spin mr-2" /> Loading settings...
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <SettingsIcon className="text-blue-400" /> ตั้งค่าระบบ (System Settings)
            </h1>

            <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-8 max-w-2xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Send size={20} className="text-blue-400" /> ตั้งค่า Telegram
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            ลิงก์กลุ่ม หรือ Channel Telegram (Telegram Group/Channel URL)
                        </label>
                        <input
                            type="url"
                            value={telegramUrl}
                            onChange={(e) => setTelegramUrl(e.target.value)}
                            placeholder="https://t.me/yourgroup"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition"
                        />
                        <p className="text-xs text-white/40 mt-2">
                            ใส่ลิงก์กลุ่ม หรือ Channel Telegram ที่ต้องการให้แสดงบนหน้าเว็บ
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        บันทึกการตั้งค่า (Save Settings)
                    </button>
                </div>
            </div>

            <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-8 max-w-2xl mt-8">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <SettingsIcon size={20} className="text-green-400" /> ตั้งค่าโหมดฟรี (Free Mode)
                </h2>
                <FreeModeSettings />
            </div>
        </div>
    );
}

function FreeModeSettings() {
    const [isFreeMode, setIsFreeMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings?key=isFreeMode`);
            const data = await res.json();
            if (data) {
                setIsFreeMode(data.value === 'true');
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async () => {
        const newValue = !isFreeMode;
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    key: "isFreeMode",
                    value: String(newValue),
                    description: "Enable Free Mode (Bypass subscription checks)"
                })
            });

            if (res.ok) {
                setIsFreeMode(newValue);
            } else {
                alert("Failed to save");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Connection error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-white/50">Loading...</div>;

    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-white font-medium">เปิดใช้งานโหมดฟรี (Enable Free Mode)</h3>
                <p className="text-sm text-white/50 mt-1">
                    เมื่อเปิดใช้งาน ผู้ใช้ทั่วไปสามารถเข้าถึงฟีเจอร์ต่างๆ (เช่น ลงรูป) ได้โดยไม่ต้องซื้อแพ็กเกจ
                    <br />
                    (Users can access features without subscription)
                </p>
            </div>
            <button
                onClick={handleToggle}
                disabled={isSaving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e1b4b] ${isFreeMode ? 'bg-green-500' : 'bg-gray-600'
                    }`}
            >
                <span
                    className={`${isFreeMode ? 'translate-x-7' : 'translate-x-1'
                        } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
                />
            </button>
        </div>
    );
}
