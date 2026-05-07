"use client";

import React, { useEffect, useState, use } from 'react';
import { getPublicProperty } from '@/app/actions';
import { Utils } from '@/lib/utils';
import Link from 'next/link';

export default function PublicPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [p, setP] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getPublicProperty(id);
            setP(res);
            setLoading(false);
        }
        load();
    }, [id]);

    if (loading) return <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
        <div className="spinner-border text-dark" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    </div>;

    if (!p) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center p-4">
                    <h1 className="display-4 fw-bold text-secondary">404</h1>
                    <p className="lead">Properti tidak ditemukan atau sudah tidak tersedia.</p>
                    <Link href="/" className="btn btn-dark rounded-4 px-4">Kembali ke Beranda</Link>
                </div>
            </div>
        );
    }

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const waText = encodeURIComponent(`Halo, saya tertarik dengan properti "${p.title}" di ${p.location}. Bisa minta info lebih lanjut?\n\nCek di sini: ${shareUrl}`);

    // Use agent's phone number if available
    let agentPhone = p.agent?.phoneNumber ? p.agent.phoneNumber.replace(/\D/g, '') : '';
    if (agentPhone.startsWith('0')) {
        agentPhone = '62' + agentPhone.slice(1);
    }
    // Default to empty if no phone number, causing the link to open WhatsApp without a specific number or handle gracefully
    const waLink = agentPhone ? `https://wa.me/${agentPhone}?text=${waText}` : '#';

    const handleCopy = () => {
        if (typeof window !== 'undefined') {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(window.location.href);
                alert('Link berhasil disalin!');
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = window.location.href;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    alert('Link berhasil disalin!');
                } catch (err) {
                    alert('Gagal menyalin link. Silakan salin URL di atas (address bar).');
                }
                textArea.remove();
            }
        }
    };

    return (
        <div className="bg-white min-vh-100 pb-5">
            {/* Gallery Wrapper */}
            {/* Carousel Gallery */}
            <div id="propertyCarousel" className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-indicators">
                    {p.images.map((_: any, i: number) => (
                        <button key={i} type="button" data-bs-target="#propertyCarousel" data-bs-slide-to={i} className={i === 0 ? 'active' : ''} aria-current={i === 0 ? 'true' : undefined} aria-label={`Slide ${i + 1}`}></button>
                    ))}
                </div>
                <div className="carousel-inner" style={{ maxHeight: '500px' }}>
                    {p.images && p.images.length > 0 ? p.images.map((img: any, i: number) => (
                        <div key={img.id} className={`carousel-item ${i === 0 ? 'active' : ''} bg-black`}>
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '500px', backgroundColor: '#000' }}>
                                <img
                                    src={img.url}
                                    className="d-block w-100 h-100"
                                    style={{ objectFit: 'contain' }}
                                    alt={`${p.title} - ${i + 1}`}
                                />
                                {/* Blurred Background for fill effect */}
                                <div
                                    className="position-absolute w-100 h-100"
                                    style={{
                                        backgroundImage: `url(${img.url})`,
                                        backgroundSize: 'cover',
                                        filter: 'blur(20px) brightness(0.5)',
                                        zIndex: -1
                                    }}
                                ></div>
                            </div>
                        </div>
                    )) : (
                        <div className="carousel-item active">
                            <div className="d-flex align-items-center justify-content-center bg-secondary text-white" style={{ height: '500px' }}>
                                No Images Available
                            </div>
                        </div>
                    )}
                </div>
                {p.images.length > 1 && (
                    <>
                        <button className="carousel-control-prev" type="button" data-bs-target="#propertyCarousel" data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target="#propertyCarousel" data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Next</span>
                        </button>
                    </>
                )}
            </div>

            <div className="container mt-4">
                <div className="row g-4">
                    {/* Left Content */}
                    <div className="col-12 col-lg-8">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className={`badge ${p.status === 'AVAILABLE' ? 'bg-success' : 'bg-danger'} rounded-pill px-3 py-2`}>
                                {p.status === 'AVAILABLE' ? 'DIJUAL' : p.status}
                            </span>
                            <span className="badge bg-light text-dark border rounded-pill px-3 py-2">{p.legality || 'Legalitas Aman'}</span>
                        </div>

                        <h1 className="fw-bold display-6 mb-1">{p.title}</h1>
                        <p className="text-secondary fs-5 d-flex align-items-center gap-1">
                            <ion-icon name="location-outline"></ion-icon> {p.location}
                        </p>

                        <div className="mt-4 p-4 rounded-4 bg-light border-0">
                            <div className="row g-3 text-center">
                                <div className="col-4 border-end">
                                    <div className="small text-secondary fw-semibold">LT</div>
                                    <div className="fw-bold fs-5">{p.landArea || '-'} <small>m²</small></div>
                                </div>
                                <div className="col-4 border-end">
                                    <div className="small text-secondary fw-semibold">LB</div>
                                    <div className="fw-bold fs-5">{p.buildingArea || '-'} <small>m²</small></div>
                                </div>
                                <div className="col-4">
                                    <div className="small text-secondary fw-semibold">TAHUN</div>
                                    <div className="fw-bold fs-5">{p.yearBuilt || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <h5 className="fw-bold border-bottom pb-2">Deskripsi</h5>
                            <p className="text-secondary lead" style={{ whiteSpace: 'pre-line' }}>
                                {p.description || 'Tidak ada deskripsi tersedia.'}
                            </p>
                        </div>

                        <div className="mt-4">
                            <h5 className="fw-bold border-bottom pb-2">Spesifikasi & Fasilitas</h5>
                            <p className="text-secondary" style={{ whiteSpace: 'pre-line' }}>
                                {p.features || '-'}
                            </p>
                        </div>

                        {/* Mobile Sticky CTA */}
                        <div className="d-lg-none fixed-bottom bg-white border-top p-3 shadow-lg">
                            <div className="d-flex gap-2">
                                <div className="flex-grow-1">
                                    <div className="small text-secondary">Harga Penawaran</div>
                                    <div className="fw-bold fs-4 text-dark">{Utils.fmtIDR(p.price)}</div>
                                </div>
                                <a href={waLink} className="btn btn-success rounded-4 px-4 d-flex align-items-center gap-2">
                                    <ion-icon name="logo-whatsapp" style={{ fontSize: '24px' }}></ion-icon>
                                    <span className="fw-bold">Chat Agen</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar (Desktop) */}
                    <div className="col-12 col-lg-4">
                        <div className="sticky-top" style={{ top: '24px' }}>
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <div className="small text-secondary fw-semibold mb-1">Harga Properti</div>
                                <h2 className="fw-bold text-dark mb-4">{Utils.fmtIDR(p.price)}</h2>

                                <div className="d-grid gap-2">
                                    <a href={waLink} target="_blank" onClick={(e) => !agentPhone && e.preventDefault()} className={`btn btn-success btn-lg rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${!agentPhone ? 'disabled' : ''}`}>
                                        <ion-icon name="logo-whatsapp" style={{ fontSize: '20px' }}></ion-icon>
                                        Hubungi Agen
                                    </a>
                                    <button onClick={handleCopy} className="btn btn-outline-dark btn-lg rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2">
                                        <ion-icon name="copy-outline" style={{ fontSize: '20px' }}></ion-icon>
                                        Salin Link Share
                                    </button>
                                </div>

                                <div className="mt-4 pt-4 border-top">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '48px', height: '48px' }}>
                                            {p.agent?.name?.charAt(0).toUpperCase() || 'A'}
                                        </div>
                                        <div>
                                            <div className="fw-bold">{p.agent?.name}</div>
                                            <div className="small text-secondary">{p.agent?.agency || 'AsanaPro Agent'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 text-center">
                                <p className="small text-secondary">Dikelola secara profesional dengan <span className="fw-bold">AsanaPro</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
