"use client";
import { useActionState, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginUser } from '../actions';
import InstallPrompt from '@/components/InstallPrompt';

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <button disabled={isPending} className="btn btn-dark btn-lg rounded-4">
            {isPending ? 'Masuk...' : 'Masuk'}
        </button>
    );
}

function LoginForm() {
    const [state, action, isPending] = useActionState(loginUser, null);
    const searchParams = useSearchParams();
    const [successMsg, setSuccessMsg] = useState('');
    const brand = { name: 'AsanaPro', year: '2026' };

    useEffect(() => {
        if (searchParams.get('verified') === '1') {
            setSuccessMsg('Email berhasil diverifikasi! Silakan login sekarang.');
        }
    }, [searchParams]);

    return (
        <div className="min-vh-100 ap-hero d-flex flex-column">
            <header className="container py-4 d-flex align-items-center gap-3">
                <img src="/logo.jpg" alt="AsanaPro Logo" width={48} height={48} className="rounded-2 shadow-sm" style={{ objectFit: 'cover' }} />
                <div className="min-w-0">
                    <div className="fw-semibold">{brand.name} <span className="text-secondary fw-normal">{brand.year}</span></div>
                    <div className="small text-secondary">Property Agency Manager</div>
                </div>
            </header>

            <main className="container flex-grow-1 d-flex flex-column justify-content-center pb-5">
                <div className="row align-items-center g-5">
                    <div className="col-12 col-lg-6">
                        <h1 className="display-4 fw-bold mb-3">Kelola Agensi Properti Lebih Mudah</h1>
                        <p className="lead text-secondary mb-4">
                            Platform manajemen all-in-one untuk agen properti modern.
                            Mulai dari listing inventory, manajemen klien (CRM), hingga
                            pembuatan link profesional untuk WhatsApp.
                        </p>
                        <div className="d-flex gap-3 text-secondary small">
                            <div className="d-flex align-items-center gap-1">
                                <ion-icon name="checkmark-circle" className="text-success"></ion-icon> Listing
                            </div>
                            <div className="d-flex align-items-center gap-1">
                                <ion-icon name="checkmark-circle" className="text-success"></ion-icon> CRM
                            </div>
                            <div className="d-flex align-items-center gap-1">
                                <ion-icon name="checkmark-circle" className="text-success"></ion-icon> Reports
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-5 offset-lg-1">
                        <div className="ap-card card border-0 shadow-lg">
                            <div className="card-body p-4 p-md-5">
                                <div className="mb-4">
                                    <div className="h4 fw-semibold">Welcome back</div>
                                    <div className="text-secondary">Login untuk akses dashboard</div>
                                </div>

                                <form className="d-grid gap-3" action={action}>
                                    <div>
                                        <label className="form-label small fw-semibold">Email</label>
                                        <input name="email" type="email" required className="form-control form-control-lg rounded-4" placeholder="email@agensi.com" />
                                    </div>
                                    <div>
                                        <label className="form-label small fw-semibold">PIN (Password)</label>
                                        <input name="pin" type="password" required className="form-control form-control-lg rounded-4" placeholder="min 6 karakter" />
                                    </div>

                                    {successMsg && (
                                        <div className="alert alert-success rounded-4 py-2 small mb-0">
                                            ✅ {successMsg}
                                        </div>
                                    )}

                                    {state?.message && (
                                        <div className="alert alert-danger rounded-4 py-2 small mb-0">
                                            {state.message}
                                            {(state as any)?.needsVerification && (
                                                <div className="mt-2">
                                                    <Link href="/verify-email" className="fw-semibold text-danger">
                                                        → Verifikasi Email Sekarang
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <SubmitButton isPending={isPending} />
                                </form>

                                <div className="text-center mt-4">
                                    <div className="text-secondary small mb-2">Belum punya akun agensi?</div>
                                    <Link href="/register" className="btn btn-outline-secondary rounded-4 w-100">Daftar Agensi Baru</Link>
                                </div>
                                <div className="mt-2 text-center small">
                                    <Link className="fw-semibold text-dark" href="/">Kembali ke Beranda</Link>
                                </div>

                                <InstallPrompt />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="container py-4 text-center text-secondary small">
                &copy; {brand.year} {brand.name}. Mobile-first Property Management.
            </footer>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
                <div className="spinner-border text-secondary" role="status" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}