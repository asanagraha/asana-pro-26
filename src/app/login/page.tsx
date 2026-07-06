"use client";
import { useActionState, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginUser } from '../actions';

function LoginForm() {
    const [state, action, isPending] = useActionState(loginUser, null);
    const searchParams = useSearchParams();
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (searchParams.get('verified') === '1') {
            setSuccessMsg('Email berhasil diverifikasi! Silakan login sekarang.');
        }
    }, [searchParams]);

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
            <div className="ap-card card border-0 shadow-sm" style={{ maxWidth: '440px', width: '100%' }}>
                <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                        <div className="btn btn-dark rounded-4 px-3 py-2 fw-bold" style={{ fontSize: '1.1rem' }}>AP</div>
                        <div>
                            <div className="fw-semibold">Masuk ke AsanaPro</div>
                            <div className="small text-secondary">Property Management System</div>
                        </div>
                    </div>

                    <form className="d-grid gap-3" action={action}>
                        <div>
                            <label className="form-label small fw-semibold">Email</label>
                            <input name="email" type="email" required
                                className="form-control form-control-lg rounded-4"
                                placeholder="email@agensi.com" />
                        </div>
                        <div>
                            <label className="form-label small fw-semibold">PIN / Password</label>
                            <input name="pin" type="password" required
                                className="form-control form-control-lg rounded-4"
                                placeholder="min 6 karakter" />
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

                        <button disabled={isPending} className="btn btn-dark btn-lg rounded-4">
                            {isPending ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    <div className="mt-4 pt-3 border-top">
                        <div className="small text-secondary">Belum punya agensi?{' '}
                            <Link className="fw-semibold text-dark" href="/register">Daftar Agensi Baru</Link>
                        </div>
                        <div className="mt-1 small">
                            <Link className="fw-semibold text-dark" href="/">← Kembali ke Beranda</Link>
                        </div>
                    </div>
                </div>
            </div>
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

