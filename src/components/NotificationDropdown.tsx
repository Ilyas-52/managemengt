'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

export interface Notification {
    id: string;
    staff_name: string;
    message: string;
    is_read: boolean;
    created_at: string;
    agence_name?: string;
}

interface Props {
    notifications: Notification[];
    unreadCount: number;
    onMarkAllRead: () => void;
    onMarkSingleRead: (id: string) => void;
    onDeleteNotification: (id: string) => void;
    onNavigate: (n: Notification) => void;
}

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onMarkSingleRead, onDeleteNotification, onNavigate }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-flex items-center">
            {/* 🔔 الجرس + الكاونتر */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:border-[#0F5A3E] transition-all shadow-sm group"
            >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 z-[100] items-center justify-center pointer-events-none">
                        <span className="animate-ping absolute inset-0 rounded-full bg-rose-500 opacity-75"></span>
                        <span className="relative flex items-center justify-center rounded-full h-5 w-5 bg-red-600 text-white text-[10px] font-black border-2 border-white shadow-md leading-none">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* 1️⃣ الـ Overlay: الضبابة (Z-Index قل من الصندوق بشوية) */}
                        <div
                            className="fixed inset-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[999998]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* 🎯 2️⃣ الصندوقة: Z-Index عالي بزاف باش تغطي الـ Sidebar وكولشي */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed z-[999999] bg-white border border-slate-100 shadow-[-20px_40px_80px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
                            style={{
                                top: '80px',         // مريكل باش يجي تحت الـ Header نيشـان
                                right: '20px',        // شاد فـ اليمين
                                width: '350px',       // العرض "بيطون"
                                maxWidth: '90vw',     // باش فـ التليفونات ميفوتش الشاشة
                                height: '500px',      // الطول مـحـدد
                                maxHeight: '80vh',    // باش ميفوتش طول الشاشة
                                borderRadius: '35px'
                            }}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase italic">تنبيهات النظام</h3>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-rose-50 text-slate-400 rounded-xl transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* 📜 الـ List مع الـ Scroll المريكّل */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white" dir="rtl">
                                {notifications.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-[10px] font-black uppercase">السجل فارغ</div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                onClick={() => {
                                                    if (!n.is_read) onMarkSingleRead(n.id);
                                                    onNavigate(n);
                                                    setIsOpen(false);
                                                }}
                                                className={`p-4 rounded-[25px] flex gap-3 cursor-pointer transition-all border ${!n.is_read ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-slate-50'}`}
                                            >
                                                <div className={`h-10 w-10 rounded-[15px] flex items-center justify-center font-black text-xs shrink-0 border-2 ${!n.is_read ? 'bg-[#0F5A3E] text-white' : 'bg-slate-50 text-slate-300'}`}>
                                                    {n.staff_name?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{n.staff_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[7px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded-md">
                                                                {new Date(n.created_at).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteNotification(n.id);
                                                                }}
                                                                className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded-md hover:bg-rose-50 flex items-center justify-center shrink-0"
                                                                title="حذف التنبيه"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className={`text-[11px] font-bold italic tracking-tighter leading-snug ${!n.is_read ? 'text-slate-800' : 'text-slate-400'}`}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
                                <button
                                    onClick={onMarkAllRead}
                                    className="w-full py-3 bg-slate-900 text-white rounded-[18px] text-[10px] font-black uppercase italic hover:bg-[#0F5A3E] transition-all"
                                >
                                    قراءة الكل
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}