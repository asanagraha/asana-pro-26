"use client";
import React, { useEffect, useState } from 'react';
import { getAdminReports, getActivityLogs } from '../../../actions';
import { Utils } from '@/lib/utils';

export default function AdminReportsPage() {
    const [data, setData] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'marketing' | 'deals' | 'summary' | 'logs'>('marketing');

    useEffect(() => {
        Promise.all([getAdminReports(), getActivityLogs()]).then(([res, logsData]) => {
            setData(res);
            setLogs(logsData);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-4 text-secondary">Memuat laporan...</div>;
    if (!data) return <div className="p-4 text-danger">Akses ditolak atau gagal memuat laporan.</div>;

    const { deals, expenses, marketingStats, summary } = data;

    return (
        <div className="d-grid gap-3 px-0">
            {/* Header */}
            <div className="ap-card card border-0 shadow-sm">
                <div className="card-body p-3 p-md-4">
                    <div className="fw-semibold fs-5 mb-1">Laporan & Analitik Agency</div>
                    <div className="text-secondary small">Data real-time — tidak perlu laporan manual dari marketing</div>

                    <div className="d-flex gap-2 mt-3 flex-wrap">
                        {(['marketing', 'deals', 'summary', 'logs'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`btn btn-sm rounded-4 flex-fill flex-md-grow-0 ${tab === t ? 'btn-dark' : 'btn-outline-secondary'}`}>
                                {t === 'marketing' ? '👥 Per Marketing' : t === 'deals' ? '🤝 Semua Deal' : t === 'summary' ? '💰 Keuangan' : '📋 Aktivitas'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-2 g-md-3">
                <div className="col-6 col-md-3">
                    <div className="ap-card card border-0 shadow-sm ap-kpi">
                        <div className="card-body p-3">
                            <div className="small opacity-75">Total Deal</div>
                            <div className="fw-bold fs-4 mt-1">{deals.length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="ap-card card border-0 shadow-sm ap-kpi ap-kpi-emerald">
                        <div className="card-body p-3">
                            <div className="small opacity-75">Deal Selesai</div>
                            <div className="fw-bold fs-4 mt-1">{deals.filter((d: any) => d.status === 'COMPLETED').length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="ap-card card border-0 shadow-sm ap-kpi ap-kpi-emerald">
                        <div className="card-body p-3">
                            <div className="small opacity-75">Total Revenue</div>
                            <div className="fw-bold" style={{ fontSize: '1rem' }}>{Utils.fmtIDR(summary.totalPaid)}</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className={`ap-card card border-0 shadow-sm ${summary.netProfit >= 0 ? 'ap-kpi' : 'ap-kpi ap-kpi-rose'}`}>
                        <div className="card-body p-3">
                            <div className="small opacity-75">Net Profit</div>
                            <div className="fw-bold" style={{ fontSize: '1rem' }}>{Utils.fmtIDR(summary.netProfit)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab: Per Marketing */}
            {tab === 'marketing' && (
                <div className="ap-card card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="fw-semibold mb-3">Performa Per Marketing</div>
                        {marketingStats.length === 0 ? (
                            <div className="text-secondary small text-center py-4">Belum ada data marketing.</div>
                        ) : (
                            <div className="d-grid gap-2">
                                {marketingStats.sort((a: any, b: any) => b.revenue - a.revenue).map((m: any, i: number) => (
                                    <div key={m.name} className="ap-card card border-0 bg-light">
                                        <div className="card-body p-3 d-flex align-items-center gap-3">
                                            <div className="fw-bold text-secondary" style={{ width: '28px', fontSize: '1.1rem' }}>#{i + 1}</div>
                                            <div className="btn btn-dark rounded-4 fw-semibold d-flex align-items-center justify-content-center"
                                                style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                                {m.name.slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <div className="fw-semibold text-truncate">{m.name}</div>
                                                <div className="small text-secondary">
                                                    {m.clients} klien · {m.deals} deal completed
                                                </div>
                                            </div>
                                            <div className="text-end" style={{ flexShrink: 0 }}>
                                                <div className="fw-semibold text-success">{Utils.fmtIDR(m.revenue)}</div>
                                                <div className="small text-secondary">revenue</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: All Deals */}
            {tab === 'deals' && (
                <div className="ap-card card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="fw-semibold mb-3">Semua Deal Agency</div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle small">
                                <thead className="table-light">
                                    <tr>
                                        <th>Properti</th>
                                        <th>Klien</th>
                                        <th>Marketing</th>
                                        <th>Tipe</th>
                                        <th className="text-end">Harga</th>
                                        <th className="text-end">Total Dibayar</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deals.map((d: any) => (
                                        <tr key={d.id}>
                                            <td className="fw-semibold" style={{ maxWidth: '120px' }}>
                                                <div className="text-truncate">{d.property?.title}</div>
                                            </td>
                                            <td>{d.client?.name}</td>
                                            <td><span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">{d.marketing?.name}</span></td>
                                            <td><span className={`badge rounded-pill ${d.dealType === 'SALE' ? 'bg-dark' : 'bg-info'}`}>{d.dealType}</span></td>
                                            <td className="text-end">{Utils.fmtIDR(d.dealPrice)}</td>
                                            <td className="text-end fw-semibold text-success">{Utils.fmtIDR(d.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)}</td>
                                            <td>
                                                <span className={`badge rounded-pill ${d.status === 'COMPLETED' ? 'bg-success' : d.status === 'CANCELLED' ? 'bg-danger' : 'bg-warning text-dark'}`}
                                                    style={{ fontSize: '0.65rem' }}>
                                                    {d.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {deals.length === 0 && <div className="text-center text-secondary py-4">Belum ada deal.</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Summary */}
            {tab === 'summary' && (
                <div className="d-grid gap-3">
                    <div className="ap-card card border-0 shadow-sm">
                        <div className="card-body p-3 p-md-4">
                            <div className="fw-semibold mb-3">Ringkasan Keuangan</div>
                            <div className="d-grid gap-2">
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span>Total Revenue Masuk</span>
                                    <span className="fw-semibold text-success">{Utils.fmtIDR(summary.totalPaid)}</span>
                                </div>
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span>Total Pengeluaran</span>
                                    <span className="fw-semibold text-danger">{Utils.fmtIDR(summary.totalExpenses)}</span>
                                </div>
                                <div className="d-flex justify-content-between py-2 fw-bold">
                                    <span>Net Profit</span>
                                    <span className={summary.netProfit >= 0 ? 'text-success' : 'text-danger'}>
                                        {Utils.fmtIDR(summary.netProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ap-card card border-0 shadow-sm">
                        <div className="card-body p-3 p-md-4">
                            <div className="fw-semibold mb-3">Rincian Pengeluaran</div>
                            {expenses.length === 0 ? (
                                <div className="text-secondary small">Belum ada pengeluaran.</div>
                            ) : (
                                expenses.map((e: any) => (
                                    <div key={e.id} className="d-flex justify-content-between py-2 border-bottom small">
                                        <div>
                                            <div>{e.description}</div>
                                            <div className="text-secondary">{Utils.fmtDate(e.expenseDate)} · {e.category.replace('_', ' ')}</div>
                                        </div>
                                        <div className="fw-semibold">{Utils.fmtIDR(e.amount)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Activity Logs */}
            {tab === 'logs' && (
                <div className="ap-card card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="fw-semibold mb-3">Semua Aktivitas Marketing</div>
                        {logs.length === 0 ? (
                            <div className="text-secondary small text-center py-4">Belum ada aktivitas.</div>
                        ) : (
                            <div className="d-grid gap-3">
                                {logs.map((log) => (
                                    <div key={log.id} className="d-flex gap-3 align-items-start p-3 bg-light rounded-4 border">
                                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                            <div className="fw-bold text-dark">{log.user?.name?.slice(0, 1).toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <div className="fw-bold">{log.user?.name} <span className="text-secondary fw-normal">melakukan</span> {log.action}</div>
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
            )}
        </div>
    );
}
