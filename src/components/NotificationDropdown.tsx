'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, RotateCcw } from 'lucide-react';

export interface Notification {
    id: string;
    staff_name: string;
    message: string;
    is_read: boolean;
    created_at: string;
    agence_name?: string;
    agency?: string;
    isFleet?: boolean;
}

interface Props {
    notifications: Notification[];
    unreadCount: number;
    selectedDate?: string;
    onDateChange?: (date: string) => void;
    onMarkAllRead: () => void;
    onMarkSingleRead: (id: string, isFleet?: boolean) => void;
    onDeleteNotification: (id: string, isFleet?: boolean) => void;
    onNavigate: (n: Notification) => void;
}

export default function NotificationDropdown({ 
    notifications, 
    unreadCount, 
    selectedDate = '', 
    onDateChange, 
    onMarkAllRead, 
    onMarkSingleRead, 
    onDeleteNotification, 
    onNavigate 
}: Props) {
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
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[999998]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* الصندوقة */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed z-[999999] bg-white border border-slate-100 shadow-[-20px_40px_80px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
                            style={{
                                top: '80px',
                                right: '20px',
                                width: '360px',
                                maxWidth: '90vw',
                                height: '540px',
                                maxHeight: '85vh',
                                borderRadius: '35px'
                            }}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-col gap-3 shrink-0" dir="rtl">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase italic">تنبيهات النظام</h3>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-rose-50 text-slate-400 rounded-xl transition-all">
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* 🌟 فلتر اختيار التاريخ المطور ليعمل 100% ف التليفون والتاتش */}
                                <div 
                                    onClick={(e) => {
                                        const input = e.currentTarget.querySelector('input');
                                        if (input) {
                                            try { input.showPicker(); } catch {}
                                        }
                                    }}
                                    className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-sm cursor-pointer select-none"
                                >
                                    <Calendar size={14} className="text-slate-400 shrink-0 pointer-events-none" />
                                    <input 
                                        type="date"
                                        value={selectedDate}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => onDateChange?.(e.target.value)}
                                        className="w-full bg-transparent text-slate-800 text-[11px] font-black outline-none cursor-pointer"
                                    />
                                    {selectedDate && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDateChange?.('');
                                            }} 
                                            className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1 shrink-0"
                                            title="عرض إشعارات اليوم الحالية"
                                        >
                                            <RotateCcw size={10} /> مسح
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 📜 الـ List مع الـ Scroll */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white" dir="rtl">
                                {notifications.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-[10px] font-black uppercase">
                                        {selectedDate ? `لا توجد تنبيهات بتاريخ ${selectedDate}` : 'السجل فارغ'}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((n) => {
                                            const dateObj = new Date(n.created_at);
                                            const formattedDate = dateObj.toISOString().split('T')[0];
                                            const formattedTime = dateObj.toTimeString().substring(0, 5);

                                            return (
                                                <div
                                                    key={`${n.id}-${n.isFleet ? 'fleet' : 'reg'}`}
                                                    onClick={() => {
                                                        if (!n.is_read) onMarkSingleRead(n.id, n.isFleet);
                                                        onNavigate(n);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`p-4 rounded-[25px] flex gap-3 cursor-pointer transition-all border mb-2 ${!n.is_read ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100'}`}
                                                    dir="rtl"
                                                >
                                                    <div className={`h-10 w-10 rounded-[15px] flex items-center justify-center font-black text-xs shrink-0 border-2 ${!n.is_read ? 'bg-[#0F5A3E] text-white border-[#0F5A3E]' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                        {n.isFleet ? '🏎️' : (n.staff_name?.[0]?.toUpperCase() || '🔔')}
                                                    </div>

                                                    <div className="flex-1 min-w-0 text-right">
                                                        <div className="flex justify-between items-center mb-1.5 gap-2">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase italic leading-none shrink-0">
                                                                {n.isFleet ? (
                                                                    n.agency === 'Krona' ? '🏎️ أسطول كرونة' :
                                                                        n.agency === 'Tazaghine' ? '🏎️ أسطول تازاغين' :
                                                                            n.agency === 'Azghar' ? '🏎️ أسطول أزغار' :
                                                                                '🏎️ أسطول بودينار'
                                                                ) : n.staff_name}
                                                            </span>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className="font-black text-slate-950 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                                                    {formattedDate}
                                                                </span>
                                                                <span className="font-black text-slate-950 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                                                    {formattedTime}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDeleteNotification(n.id, n.isFleet);
                                                                    }}
                                                                    className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded-md hover:bg-rose-50 flex items-center justify-center shrink-0"
                                                                    title="حذف التنبيه"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <p className="text-xs font-black text-slate-950 tracking-tighter leading-snug w-full">
                                                            {n.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
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