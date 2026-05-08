'use client';
import { Save, Car, Gauge, Fuel } from 'lucide-react';
import { motion } from 'framer-motion';


import { VehicleLog } from '@/types/dashboard';

interface LogisticsProps {
    vehicleLog: Partial<VehicleLog>;
    setVehicleLog: (val: Partial<VehicleLog>) => void;
    saveVehicleLog: () => Promise<void>;
    loading: boolean;
}

export default function HamzaLogistics({ vehicleLog, setVehicleLog, saveVehicleLog, loading }: LogisticsProps) {

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        (e.target as HTMLInputElement).blur();
    };

    const inputFields = [
        { label: 'عداد البداية (KM)', key: 'mileage_start', icon: <Car size={18} /> },
        { label: 'عداد النهاية (KM)', key: 'mileage_end', icon: <Gauge size={18} /> },
        { label: 'مصاريف الوقود (DH)', key: 'fuel_expense', icon: <Fuel size={18} /> }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto pb-24 px-4"
        >
            <div className="bg-white border-2 border-slate-100 p-8 sm:p-12 rounded-[50px] shadow-sm space-y-10">

                {/* Header بسيط ومباشر */}
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                    <div className="w-12 h-12 bg-slate-900 text-[#1dbf73] rounded-2xl flex items-center justify-center shadow-sm">
                        <Car size={24} />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-slate-800 italic uppercase">سجل السيارة</h2>
                    </div>
                </div>

                {/* الـ Inputs مسـتّـفين ناضيين */}
                <div className="space-y-8">
                    {inputFields.map((field) => (
                        <div key={field.key} className="space-y-3">
                            <label className="flex items-center gap-2 text-[11px] text-slate-400 font-black px-2 uppercase tracking-widest">
                                <span className="text-slate-900">{field.icon}</span>
                                {field.label}
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    onWheel={handleWheel}
                                    value={vehicleLog[field.key as keyof VehicleLog] || ''}
                                    onChange={(e) => setVehicleLog({ ...vehicleLog, [field.key]: e.target.value === '' ? 0 : Number(e.target.value) })}
                                    className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[28px] px-8 text-3xl font-black text-slate-900 text-center focus:border-[#1dbf73] focus:bg-white focus:ring-4 focus:ring-[#1dbf73]/5 outline-none transition-all placeholder-slate-200 italic"
                                    placeholder="0000"
                                />
                            </div>
                        </div>
                    ))}

                    {/* زر الحفظ: "بيطون" وأخضر */}
                    <div className="pt-6">
                        <button
                            disabled={loading}
                            onClick={saveVehicleLog}
                            style={{ backgroundColor: '#1dbf73', opacity: 1 }}
                            className="w-full h-16 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:bg-slate-300 transition-all border-none outline-none"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={22} color="white" />
                                    <span className="italic uppercase tracking-wider text-white">حفظ</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}