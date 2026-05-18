'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/components/NotificationDropdown';

export function useNotifications(agencyName: string) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const fetchNotifications = async () => {
        if (!agencyName) return;

        // 1. جلب الليستة (مع استبعاد ميساجات السيستيم الأوتوماتيكية)
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('agency', agencyName)
            .not('message', 'ilike', '%بمبلغ%')
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) {
            console.error("❌ [FETCH ERROR]:", error.message);
            return;
        }

        if (data) setNotifications(data);

        // 2. 🚀 حساب الـ Counter (هادي اللي كتحرك الجرس)
        const { count: realUnreadCount, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('agency', agencyName)
            .eq('is_read', false)
            .not('message', 'ilike', '%بمبلغ%');

        if (!countError) {
            setUnreadCount(realUnreadCount || 0);
            console.log("📊 Counter Updated for Younes:", realUnreadCount);
        }
    };

    const markAllAsRead = async () => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        await supabase.from('notifications').update({ is_read: true }).eq('agency', agencyName).eq('is_read', false);
        fetchNotifications();
    };

    const markSingleAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        fetchNotifications();
    };

    const deleteNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const deletedNotif = notifications.find(n => n.id === id);
        if (deletedNotif && !deletedNotif.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        await supabase.from('notifications').delete().eq('id', id);
        fetchNotifications();
    };

    useEffect(() => {
        if (!agencyName) return;
        fetchNotifications();

        // 🛰️ الـ Real-time: مريكل باش يسمع غير للوكالة ديالك
        const channel = supabase.channel(`notifs-${agencyName}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `agency=eq.${agencyName}` // 👈 ركز هنا
                },
                () => {
                    console.log("🔔 New Notification Detected!");
                    fetchNotifications();
                }
            ).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [agencyName]);

    return { notifications, unreadCount, markAllAsRead, markSingleAsRead, deleteNotification, fetchNotifications };
}