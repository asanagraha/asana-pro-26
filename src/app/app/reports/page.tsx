"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getActivityLogs } from '@/app/actions';
import { Utils } from '@/lib/utils';

export default function ReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        getSession().then(s => {
            if (s?.role === 'ADMIN') {
                router.replace('/app/admin/reports');
            } else {
                getActivityLogs().then(data => {
                    setLogs(data);
                    setLoading(false);
                });
            }
        });
    }, [router]);

    if (loading) return <div className="p-4 text-secondary">Memuat laporan...</div>;

    return (
        <div className="d-grid gap-3 pb-5">
            <div className="ap-card card border-0 shadow-sm">
                <div className="card-body p-4">
                    <h4 className="fw-bold mb-1">Laporan Aktivitas Marketing</h4>
                    <p className="text-secondary small mb-4">Catatan aktivitas harian Anda otomatis terekam di sini.</p>
                    
                    {logs.length === 0 ? (
                        <div className="text-center p-5 bg-light rounded-4 border-dashed">
                            <ion-icon name="document-text-outline" style={{ fontSize: '48px' }} className="text-secondary mb-2"></ion-icon>
                            <div className="fw-bold text-dark">Belum ada aktivitas</div>
                            <div className="small text-secondary mt-1">Aktivitas seperti tambah klien, properti, follow up, dll akan otomatis muncul di sini.</div>
                        </div>
                    ) : (
                        <div className="d-grid gap-3">
                            {logs.map((log) => (
                                <div key={log.id} className="d-flex gap-3 align-items-start p-3 bg-light rounded-4 border">
                                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                        <ion-icon name="checkmark-done-circle-outline" className="text-success" style={{ fontSize: '24px' }}></ion-icon>
                                    </div>
                                    <div>
                                        <div className="fw-bold">{log.action}</div>
                                        <div className="text-secondary small">{log.details}</div>
                                        <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                                            {Utils.fmtDate(log.createdAt)} · {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
