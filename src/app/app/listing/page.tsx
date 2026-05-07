"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Utils } from '@/lib/utils';
import AddPropertyModal from './add-property-modal';
import { getProperties } from '@/app/actions';

export default function ListingPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        // Tampilkan cache langsung tanpa delay
        const cached = localStorage.getItem('listing_cache');
        if (cached) {
            try { setItems(JSON.parse(cached)); setLoading(false); } catch(e) {}
        }

        try {
            const res = await getProperties();
            setItems(res);
            localStorage.setItem('listing_cache', JSON.stringify(res));
        } catch (e) {
            console.error("Failed to load properties:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    if (loading) return <div className="p-4 text-secondary text-center">Memuat data inventory...</div>;

    return (
        <>
            <div className="ap-card card border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="fw-semibold">Inventory Properti</div>
                        <div className="ms-auto">
                            <button
                                className="btn btn-dark rounded-4 d-flex align-items-center gap-1"
                                data-bs-toggle="modal"
                                data-bs-target="#newPropertyModal"
                            >
                                <ion-icon className="ap-icon" name="add-outline"></ion-icon> <span>Properti</span>
                            </button>
                        </div>
                    </div>

                    <div className="row g-2 mt-3">
                        <div className="col-12">
                            <div className="text-secondary small">Total Listing: {items.length} unit</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3 mt-1">
                {items.length > 0 ? items.map((p: any) => {
                    const cover = p.images && p.images.length > 0 ? p.images[0].url : null;
                    const badge = p.status === 'SOLD' ? 'text-bg-danger' : 'text-bg-success';
                    return (
                        <div key={p.id} className="col-12 col-sm-6 col-lg-4">
                            <div className="ap-card card border-0 shadow-sm h-100 overflow-hidden position-relative animate-fade-in d-flex flex-column">
                                <Link href={`/app/listing/${p.id}`} className="text-decoration-none text-dark flex-grow-1">
                                    <div className="bg-light position-relative">
                                        {cover ? (
                                            <img src={cover} alt={p.title} className="w-100 object-fit-cover" style={{ height: '200px' }} />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center text-secondary bg-light" style={{ height: '200px' }}>
                                                <ion-icon name="image-outline" style={{ fontSize: '32px' }}></ion-icon>
                                            </div>
                                        )}
                                        <div className="position-absolute top-0 start-0 m-2">
                                            <span className={`badge ${badge} ap-pill shadow-sm`}>{p.status}</span>
                                        </div>
                                    </div>
                                    <div className="card-body p-3">
                                        <div className="fw-bold text-truncate mb-1" title={p.title}>{p.title}</div>
                                        <div className="small text-secondary text-truncate mb-2">
                                            <ion-icon name="location-outline"></ion-icon> {p.location || '-'}
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mt-auto">
                                            <div className="fw-bold text-dark">{Utils.fmtIDR(p.price)}</div>
                                            <div className="small text-secondary">
                                                {p.landArea || 0}/{p.buildingArea || 0} m²
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <div className="card-footer bg-white border-top-0 p-3 pt-0">
                                    <div className="d-flex gap-2">
                                        <Link href={`/app/listing/${p.id}`} className="btn btn-sm btn-outline-dark flex-grow-1 rounded-3">Edit</Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const url = `${window.location.origin}/p/${p.id}`;
                                                if (navigator.clipboard && window.isSecureContext) {
                                                    navigator.clipboard.writeText(url);
                                                    alert('Link Landing Page Properti berhasil disalin!');
                                                } else {
                                                    const textArea = document.createElement("textarea");
                                                    textArea.value = url;
                                                    textArea.style.position = "fixed";
                                                    textArea.style.left = "-999999px";
                                                    document.body.appendChild(textArea);
                                                    textArea.focus();
                                                    textArea.select();
                                                    try {
                                                        document.execCommand('copy');
                                                        alert('Link Landing Page Properti berhasil disalin!');
                                                    } catch (err) {
                                                        alert('Gagal menyalin link. Silakan buka halaman Edit untuk menyalin.');
                                                    }
                                                    textArea.remove();
                                                }
                                            }}
                                            className="btn btn-sm btn-dark rounded-3 px-3"
                                            title="Share Link"
                                        >
                                            <ion-icon name="share-social-outline"></ion-icon>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-12">
                        <div className="ap-card card border-0 shadow-sm">
                            <div className="card-body p-5 text-center text-secondary">
                                <ion-icon name="business-outline" style={{ fontSize: '48px' }} className="mb-3 opacity-25"></ion-icon>
                                <h5>Belum ada properti</h5>
                                <p className="small mb-0">Klik tombol <b>+ Properti</b> di atas untuk mulai membuat listing pertama Anda.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AddPropertyModal onSuccess={load} />
        </>
    );
}
