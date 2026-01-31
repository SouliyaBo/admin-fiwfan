"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../lib/constants";
import { Save, Loader2, Send, SettingsIcon } from "lucide-react";

import { getImageUrl } from "../../lib/images";
import { uploadS3File } from "../../lib/upload";
import { QrCode } from "lucide-react";

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

            {/* Payment Settings */}
            <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-8 max-w-2xl mt-8">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <QrCode size={20} className="text-yellow-400" /> ตั้งค่า QR การชำระเงิน (Payment QR Codes)
                </h2>
                <PaymentSettings />
            </div>
        </div>
    );
}

function PaymentSettings() {
    const [qrTh, setQrTh] = useState("");
    const [qrLa, setQrLa] = useState("");
    const [qrWeChat, setQrWeChat] = useState("");

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchQRs();
    }, []);

    const fetchQRs = async () => {
        try {
            // Fetch all settings
            const res = await fetch(`${API_BASE_URL}/settings`);
            const data = await res.json();

            // Map settings to state
            const th = data.find((s: any) => s.key === 'payment_qr_th');
            const la = data.find((s: any) => s.key === 'payment_qr_la');
            const wc = data.find((s: any) => s.key === 'payment_qr_wechat');

            if (th) setQrTh(th.value);
            if (la) setQrLa(la.value);
            if (wc) setQrWeChat(wc.value);
        } catch (error) {
            console.error("Failed to fetch payment settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File, type: 'th' | 'la' | 'wc') => {
        setUploading(type);
        try {
            const key = await uploadS3File(file, "system"); // Upload to 'system' folder
            const value = getImageUrl(key); // Construct full URL

            // Save settings key
            const settingKey = type === 'th' ? 'payment_qr_th' : type === 'la' ? 'payment_qr_la' : 'payment_qr_wechat';
            const description = type === 'th' ? 'QR Code for Thai PromptPay' : type === 'la' ? 'QR Code for Lao OnePay' : 'QR Code for WeChat Pay';

            const token = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    key: settingKey,
                    value: value,
                    description: description
                })
            });

            // Update local state
            if (type === 'th') setQrTh(value);
            if (type === 'la') setQrLa(value);
            if (type === 'wc') setQrWeChat(value);

            alert("อัพโหลดรูปภาพสำเร็จ (Saved)");

        } catch (error) {
            console.error(error);
            alert("Upload Failed");
        } finally {
            setUploading(null);
        }
    };

    if (loading) return <div className="text-white/50">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* THAI QR */}
            <div className="border border-white/5 bg-white/5 rounded-xl p-4">
                <label className="block text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                    <span className="textlg">🇹🇭</span> Thai QR (PromptPay)
                </label>
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {qrTh ? (
                            <img src={qrTh} alt="QR TH" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-xs text-white/20">No Img</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block w-full">
                            <span className="sr-only">Choose profile photo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'th')}
                                disabled={uploading === 'th'}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                cursor-pointer"
                            />
                        </label>
                        <p className="text-xs text-white/40 mt-2">อัพโหลดรูป QR Code สำหรับรับเงินไทย (PromptPay)</p>
                        {uploading === 'th' && <span className="text-xs text-blue-400 mt-1">Uploading...</span>}
                    </div>
                </div>
            </div>

            {/* LAO QR */}
            <div className="border border-white/5 bg-white/5 rounded-xl p-4">
                <label className="block text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                    <span className="text-lg">🇱🇦</span> Lao QR (OnePay)
                </label>
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {qrLa ? (
                            <img src={qrLa} alt="QR LA" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-xs text-white/20">No Img</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block w-full">
                            <span className="sr-only">Choose profile photo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'la')}
                                disabled={uploading === 'la'}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                cursor-pointer"
                            />
                        </label>
                        <p className="text-xs text-white/40 mt-2">อัพโหลดรูป QR Code สำหรับรับเงินลาว (OnePay)</p>
                        {uploading === 'la' && <span className="text-xs text-blue-400 mt-1">Uploading...</span>}
                    </div>
                </div>
            </div>

            {/* WECHAT QR */}
            <div className="border border-white/5 bg-white/5 rounded-xl p-4">
                <label className="block text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                    <span className="text-lg">🇨🇳</span> WeChat Pay (จีน)
                </label>
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {qrWeChat ? (
                            <img src={qrWeChat} alt="QR WC" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-xs text-white/20">No Img</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block w-full">
                            <span className="sr-only">Choose profile photo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'wc')}
                                disabled={uploading === 'wc'}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                cursor-pointer"
                            />
                        </label>
                        <p className="text-xs text-white/40 mt-2">อัพโหลดรูป QR Code สำหรับรับเงิน WeChat (จีน)</p>
                        {uploading === 'wc' && <span className="text-xs text-blue-400 mt-1">Uploading...</span>}
                    </div>
                </div>
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
