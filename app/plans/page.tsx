"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../lib/constants";
import { Wallet, Plus, Edit, Trash2, X, Save, Loader2, GripVertical } from "lucide-react";

interface PlanPrice {
    duration: string;
    price: number;
    days: number;
}

interface Plan {
    _id?: string;
    id: string; // unique ID like SUPER_STAR
    name: string;
    description: string;
    features: string[];
    prices: PlanPrice[];
    theme: string;
    isActive: boolean;
    rankingPriority: number;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/plans`);
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            console.error("Failed to fetch plans:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (plan: Plan) => {
        setCurrentPlan(plan);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentPlan({
            id: "",
            name: "",
            description: "",
            features: [""],
            prices: [{ duration: "", price: 0, days: 0 }],
            theme: "blue",
            isActive: true,
            rankingPriority: 0
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/plans/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchPlans();
            } else {
                alert("Failed to delete plan");
            }
        } catch (error) {
            console.error("Error deleting plan:", error);
        }
    };

    const handleSave = async (plan: Plan) => {
        try {
            const token = localStorage.getItem("token");
            const method = plan._id ? "PUT" : "POST";
            const url = plan._id ? `${API_BASE_URL}/plans/${plan._id}` : `${API_BASE_URL}/plans`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(plan)
            });

            if (res.ok) {
                setIsEditing(false);
                fetchPlans();
            } else {
                const error = await res.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error("Error saving plan:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-white">
                <Loader2 className="animate-spin mr-2" /> Loading plans...
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Wallet className="text-blue-400" /> จัดการแพ็กเกจ (Plans)
                </h1>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition"
                >
                    <Plus size={20} /> เพิ่มแพ็กเกจ
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan._id || plan.id} className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-6 relative group hover:border-blue-500/50 transition">
                        <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold ${plan.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                        <p className="text-white/50 text-sm mb-4">{plan.description}</p>

                        <div className="bg-black/20 rounded-lg p-3 mb-4">
                            <div className="text-xs text-white/40 mb-2 uppercase tracking-wide">Prices</div>
                            <div className="space-y-1">
                                {plan.prices.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-white/70">{p.duration}</span>
                                        <span className="text-white font-mono">{p.price} THB</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="text-xs text-white/40 mb-2 uppercase tracking-wide">Features</div>
                            <ul className="text-sm text-white/70 list-disc list-inside">
                                {plan.features.slice(0, 3).map((f, i) => (
                                    <li key={i} className="truncate">{f}</li>
                                ))}
                                {plan.features.length > 3 && <li className="text-white/30 italic">+{plan.features.length - 3} more</li>}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                            <button
                                onClick={() => handleEdit(plan)}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/70 hover:text-blue-400 transition"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => plan._id && handleDelete(plan._id)}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/70 hover:text-red-400 transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isEditing && currentPlan && (
                <PlanEditor
                    plan={currentPlan}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            )}
        </div>
    );
}

function PlanEditor({ plan, onSave, onCancel }: { plan: Plan, onSave: (p: Plan) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState<Plan>(plan);

    const handleChange = (field: keyof Plan, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const addFeature = () => {
        setFormData({ ...formData, features: [...formData.features, ""] });
    };

    const removeFeature = (index: number) => {
        const newFeatures = formData.features.filter((_, i) => i !== index);
        setFormData({ ...formData, features: newFeatures });
    };

    const handlePriceChange = (index: number, field: keyof PlanPrice, value: any) => {
        const newPrices = [...formData.prices];
        newPrices[index] = { ...newPrices[index], [field]: value };
        setFormData({ ...formData, prices: newPrices });
    };

    const addPrice = () => {
        setFormData({ ...formData, prices: [...formData.prices, { duration: "", price: 0, days: 0 }] });
    };

    const removePrice = (index: number) => {
        const newPrices = formData.prices.filter((_, i) => i !== index);
        setFormData({ ...formData, prices: newPrices });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1e1b4b] z-10">
                    <h2 className="text-xl font-bold text-white">
                        {plan._id ? "แก้ไขแพ็กเกจ (Edit Plan)" : "สร้างแพ็กเกจใหม่ (Create Plan)"}
                    </h2>
                    <button onClick={onCancel} className="text-white/50 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">Plan ID (Unique)</label>
                            <input
                                type="text"
                                value={formData.id}
                                onChange={(e) => handleChange("id", e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                placeholder="e.g. SUPER_STAR"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white h-20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">Ranking Priority</label>
                            <input
                                type="number"
                                value={formData.rankingPriority}
                                onChange={(e) => handleChange("rankingPriority", Number(e.target.value))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                placeholder="100, 50, 10..."
                            />
                            <p className="text-xs text-white/30 mt-1">Higher number = Higher rank</p>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => handleChange("isActive", e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                            />
                            <label className="text-white font-medium">Active (Enable Plan)</label>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-white/70">Prices</label>
                            <button onClick={addPrice} className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30">+ Add Price</button>
                        </div>
                        <div className="space-y-2">
                            {formData.prices.map((p, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={p.duration}
                                        onChange={(e) => handlePriceChange(i, "duration", e.target.value)}
                                        placeholder="Duration (e.g. 1 Week)"
                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                    <input
                                        type="number"
                                        value={p.days}
                                        onChange={(e) => handlePriceChange(i, "days", Number(e.target.value))}
                                        placeholder="Days"
                                        className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                    <input
                                        type="number"
                                        value={p.price}
                                        onChange={(e) => handlePriceChange(i, "price", Number(e.target.value))}
                                        placeholder="Price"
                                        className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                    <button onClick={() => removePrice(i)} className="text-red-400 hover:bg-red-400/10 p-2 rounded"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-white/70">Features</label>
                            <button onClick={addFeature} className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30">+ Add Feature</button>
                        </div>
                        <div className="space-y-2">
                            {formData.features.map((f, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={f}
                                        onChange={(e) => handleFeatureChange(i, e.target.value)}
                                        placeholder="Feature description"
                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                    <button onClick={() => removeFeature(i)} className="text-red-400 hover:bg-red-400/10 p-2 rounded"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#1e1b4b] sticky bottom-0 z-10 rounded-b-2xl">
                    <button onClick={onCancel} className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/5 transition">
                        Cancel
                    </button>
                    <button onClick={() => onSave(formData)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition">
                        <Save size={18} /> Save Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
