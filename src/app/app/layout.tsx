"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSession, logoutAgent } from '../actions';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const backdrops = document.getElementsByClassName('modal-backdrop');
        while (backdrops.length > 0) {
            backdrops[0].parentNode?.removeChild(backdrops[0]);
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, [pathname]);

    useEffect(() => {
        setMounted(true);
        getSession().then(u => {
            if (!u) { window.location.href = '/login'; return; }
            setUser(u);
        });
    }, []);

    if (!mounted || !user) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="text-secondary small">Memuat...</div>
        </div>
    );

    const isAdmin = user.role === 'ADMIN';

    const navItem = (path: string, label: string, iconName: string) => {
        const isActive = pathname.startsWith(path);
        return (
            <Link className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`} href={path}>
                <ion-icon className="ap-icon" name={iconName}></ion-icon>
                <span className="fw-semibold">{label}</span>
            </Link>
        );
    };

    const bottomItem = (path: string, label: string, iconName: string) => {
        const isActive = pathname.startsWith(path);
        return (
            <Link className={`nav-link text-center ${isActive ? 'text-dark fw-semibold' : 'text-secondary'}`} href={path}>
                <div className="d-flex justify-content-center"><ion-icon className="ap-icon" name={iconName}></ion-icon></div>
                <div style={{ fontSize: '0.65rem' }}>{label}</div>
            </Link>
        );
    };

    const roleLabel = isAdmin ? 'Admin' : 'Marketing';
    const roleBadgeClass = isAdmin ? 'bg-dark text-white' : 'bg-primary bg-opacity-10 text-primary';

    return (
        <div className="min-vh-100">
            <header className="ap-nav ap-soft border-bottom">
                <div className="container py-2 py-md-3 d-flex align-items-center gap-2">
                    <Link href="/app/dashboard">
                        <img src="/logo.jpg" alt="Logo" width="38" height="38" className="rounded-3" />
                    </Link>
                    <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>
                            {user.agency?.name || 'AsanaPro'}
                        </div>
                        <div className="small text-secondary text-truncate" style={{ fontSize: '0.72rem' }}>
                            {user.name} · <span className={`badge ${roleBadgeClass} rounded-pill`} style={{ fontSize: '0.6rem' }}>{roleLabel}</span>
                        </div>
                    </div>
                    <button onClick={() => logoutAgent()} className="btn btn-outline-secondary btn-sm rounded-4" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="container py-3 py-md-4 pb-5 mb-5 mb-lg-0">
                <div className="row g-3 g-md-4">
                    <aside className="d-none d-lg-block col-lg-3">
                        <div className="ap-card card border-0 shadow-sm">
                            <div className="card-body pb-1">
                                <div className="small text-secondary">Masuk sebagai</div>
                                <div className="fw-semibold text-truncate">{user.name}</div>
                                <span className={`badge ${roleBadgeClass} rounded-pill mt-1`} style={{ fontSize: '0.7rem' }}>{roleLabel}</span>
                            </div>
                            <div className="list-group list-group-flush">
                                {navItem('/app/dashboard', 'Dashboard', 'home-outline')}
                                {navItem('/app/listing', 'Listing Properti', 'pricetags-outline')}
                                {navItem('/app/crm', 'CRM Klien', 'people-outline')}
                                {navItem('/app/deals', 'Deal & Pembayaran', 'receipt-outline')}
                                {isAdmin && navItem('/app/admin/finance', 'Keuangan', 'cash-outline')}
                                {isAdmin && navItem('/app/admin/reports', 'Laporan', 'stats-chart-outline')}
                                {!isAdmin && navItem('/app/reports', 'Laporan Aktivitas', 'document-text-outline')}
                                {isAdmin && navItem('/app/admin/team', 'Tim Marketing', 'people-circle-outline')}
                                {navItem('/app/settings', 'Pengaturan', 'settings-outline')}
                            </div>
                        </div>
                    </aside>

                    <main className="col-12 col-lg-9 ap-main">
                        {children}
                    </main>
                </div>
            </div>

            {/* Bottom Navigation Mobile */}
            <nav className="ap-bottom-nav d-lg-none fixed-bottom border-top bg-white z-3">
                <div className="container px-0">
                    <div className="nav nav-pills nav-justified py-1">
                        {bottomItem('/app/dashboard', 'Dashboard', 'home-outline')}
                        {bottomItem('/app/listing', 'Listing', 'pricetags-outline')}
                        {bottomItem('/app/crm', 'CRM', 'people-outline')}
                        {bottomItem('/app/deals', 'Deal', 'receipt-outline')}
                        {isAdmin
                            ? bottomItem('/app/admin/reports', 'Laporan', 'stats-chart-outline')
                            : bottomItem('/app/reports', 'Laporan', 'document-text-outline')
                        }
                    </div>
                </div>
            </nav>
        </div>
    );
}
