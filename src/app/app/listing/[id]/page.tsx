"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Utils } from '@/lib/utils';
import { getProperty, updateProperty, deleteProperty } from '@/app/actions';
import CurrencyInput from '@/components/CurrencyInput';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [p, setP] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    async function load() {
        const res = await getProperty(id);
        if (!res) {
            setP(null);
        } else {
            setP(res);
            setImages(res.images?.map((img: any) => img.url) || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, [id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 800;

                    if (width > height && width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    } else if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setImages(prev => [...prev, dataUrl]);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) return <div className="p-4 text-center text-secondary">Memuat detail properti...</div>;

    if (!p) {
        return (
            <div className="ap-card card border-0 shadow-sm">
                <div className="card-body p-5 text-center">
                    <ion-icon name="alert-circle-outline" style={{ fontSize: '48px' }} className="text-danger mb-3"></ion-icon>
                    <h5 className="fw-bold">Properti tidak ditemukan</h5>
                    <p className="text-secondary small">Data mungkin sudah dihapus atau Anda tidak memiliki akses.</p>
                    <Link href="/app/listing" className="btn btn-dark rounded-4 px-4 mt-2">Kembali ke Inventory</Link>
                </div>
            </div>
        );
    }

    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${p.id}` : '';
    const mainPhoto = p.images && p.images.length > 0 ? p.images[0].url : null;

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const fd = new FormData(e.currentTarget);
        const res = await updateProperty(id, fd);
        setSaving(false);
        if (res.success) {
            alert('Perubahan berhasil disimpan');
            load();
        } else {
            alert(res.message || 'Gagal menyimpan perubahan');
        }
    };

    const handleDelete = async () => {
        if (confirm('Apakah Anda yakin ingin menghapus properti ini secara permanen?')) {
            const res = await deleteProperty(id);
            if (res.success) {
                router.push('/app/listing');
            } else {
                alert(res.message || 'Gagal menghapus properti');
            }
        }
    };

    const copyShareLink = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(publicUrl);
            alert('Link Landing Page berhasil disalin!');
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = publicUrl;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert('Link Landing Page berhasil disalin!');
            } catch (err) {
                alert('Gagal menyalin link. Silakan salin secara manual.');
            }
            textArea.remove();
        }
    };

    return (
        <div className="d-grid gap-3 pb-5">
            {/* Header & Quick Action */}
            <div className="ap-card card border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3 flex-wrap">
                        <div className="min-w-0 flex-grow-1">
                            <div className="small text-secondary fw-bold text-uppercase mb-1">Detail Listing</div>
                            <h4 className="fw-bold mb-0">{p.title}</h4>
                            <div className="text-secondary d-flex align-items-center gap-1">
                                <ion-icon name="location-outline"></ion-icon> {p.location || '-'}
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <Link href="/app/listing" className="btn btn-outline-secondary rounded-4 px-3">
                                <ion-icon name="arrow-back-outline"></ion-icon>
                            </Link>
                            <button onClick={handleDelete} className="btn btn-outline-danger rounded-4 px-3">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    </div>

                    <div className="row g-3 mt-4">
                        {/* Media Preview */}
                        <div className="col-12 col-md-6">
                            <div className="ap-card card border-0 bg-light overflow-hidden shadow-sm" style={{ height: '350px' }}>
                                {mainPhoto ? (
                                    <img src={mainPhoto} className="w-100 h-100 object-fit-cover" alt="cover" />
                                ) : (
                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary">
                                        <ion-icon name="image-outline" style={{ fontSize: '48px' }}></ion-icon>
                                    </div>
                                )}
                                <div className="position-absolute bottom-0 start-0 m-3">
                                    <span className="badge bg-dark rounded-pill px-3 py-2">
                                        <ion-icon name="images-outline" className="me-1"></ion-icon> {p.images?.length || 0} Foto
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex gap-2 mt-2 overflow-auto py-2">
                                {p.images?.map((img: any) => (
                                    <img key={img.id} src={img.url} className="rounded-3 border object-fit-cover" style={{ width: '80px', height: '60px', flexShrink: 0 }} alt="gallery" />
                                ))}
                            </div>
                        </div>

                        {/* Public Link Card */}
                        <div className="col-12 col-md-6">
                            <div className="ap-card card border-0 bg-dark text-white rounded-4 h-100">
                                <div className="card-body p-4 d-flex flex-column">
                                    <div className="mb-4">
                                        <div className="small text-white-50 fw-bold text-uppercase mb-2">Landing Page Publik</div>
                                        <p className="small mb-3">Gunakan link ini untuk promosi ke customer Anda. Tampilan sudah didesain khusus agar menarik tanpa perlu login.</p>
                                        <div className="bg-white bg-opacity-10 p-3 rounded-4 border border-white border-opacity-10 mb-3">
                                            <code className="text-white-50 d-block text-truncate small">{publicUrl}</code>
                                        </div>
                                    </div>

                                    <div className="mt-auto d-grid gap-2">
                                        <button onClick={copyShareLink} className="btn btn-light btn-lg rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2">
                                            <ion-icon name="copy-outline" style={{ fontSize: '20px' }}></ion-icon>
                                            Salin Link Landing Page
                                        </button>
                                        <a href={`https://wa.me/?text=${encodeURIComponent(`Halo, silakan cek detail properti "${p.title}" di sini:\n\n${publicUrl}`)}`} target="_blank" className="btn btn-success btn-lg rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2">
                                            <ion-icon name="logo-whatsapp" style={{ fontSize: '20px' }}></ion-icon>
                                            Kirim ke WhatsApp
                                        </a>
                                        <Link href={`/p/${p.id}`} target="_blank" className="btn btn-outline-light border-0 small opacity-75">Preview Tampilan Customer</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <div className="ap-card card border-0 shadow-sm">
                <div className="card-body p-4">
                    <h5 className="fw-bold mb-4">Edit Detail Properti</h5>
                    <form className="row g-3" onSubmit={handleSave}>
                        <input type="hidden" name="images" value={JSON.stringify(images)} />
                        
                        <div className="col-12">
                            <label className="form-label small fw-bold text-secondary">NAMA PROPERTI</label>
                            <input name="title" defaultValue={p.title} required className="form-control form-control-lg rounded-4 border-2" />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">HARGA (IDR)</label>
                            <CurrencyInput name="price" defaultValue={p.price} required className="form-control form-control-lg rounded-4 border-2" />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">LOKASI / AREA</label>
                            <input name="location" defaultValue={p.location} required className="form-control form-control-lg rounded-4 border-2" />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-secondary">LUAS TANAH (M²)</label>
                            <input name="landArea" defaultValue={p.landArea} type="number" className="form-control form-control-lg rounded-4 border-2" />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-secondary">LUAS BANGUNAN (M²)</label>
                            <input name="buildingArea" defaultValue={p.buildingArea} type="number" className="form-control form-control-lg rounded-4 border-2" />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-secondary">TAHUN DIBANGUN</label>
                            <input name="yearBuilt" defaultValue={p.yearBuilt} type="number" className="form-control form-control-lg rounded-4 border-2" />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">LEGALITAS</label>
                            <select name="legality" defaultValue={p.legality} className="form-select form-select-lg rounded-4 border-2">
                                <option value="SHM">SHM (Sertifikat Hak Milik)</option>
                                <option value="HGB">HGB (Hak Guna Bangunan)</option>
                                <option value="Lainnya">Lainnya / Surat Ijo / Girik</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">STATUS LISTING</label>
                            <select name="status" defaultValue={p.status} className="form-select form-select-lg rounded-4 border-2">
                                <option value="AVAILABLE">Tersedia (Available)</option>
                                <option value="SOLD">Terjual (Sold)</option>
                                <option value="RENTED">Disewakan (Rented)</option>
                            </select>
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-bold text-secondary">FASILITAS / SPESIFIKASI</label>
                            <textarea name="features" defaultValue={p.features} className="form-control rounded-4 border-2" rows={3}></textarea>
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-bold text-secondary">DESKRIPSI LENGKAP</label>
                            <textarea name="description" defaultValue={p.description} className="form-control rounded-4 border-2" rows={5}></textarea>
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-bold text-secondary d-block">GALERI FOTO</label>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {images.map((img, i) => (
                                    <div key={i} className="position-relative" style={{ width: '80px', height: '80px' }}>
                                        <img src={img} className="w-100 h-100 object-fit-cover rounded-3 border" alt="preview" />
                                        <button type="button" onClick={() => removeImage(i)} className="position-absolute top-0 end-0 btn btn-danger btn-sm p-0 rounded-circle" style={{ width: '20px', height: '20px', marginTop: '-8px', marginRight: '-8px' }}>×</button>
                                    </div>
                                ))}
                                <label className="btn btn-outline-dark d-flex flex-column align-items-center justify-content-center border-dashed rounded-3" style={{ width: '80px', height: '80px', borderStyle: 'dashed' }}>
                                    <ion-icon name="camera-outline" style={{ fontSize: '24px' }}></ion-icon>
                                    <span className="small mt-1">Upload</span>
                                    <input type="file" multiple accept="image/*" className="d-none" onChange={handleImageChange} />
                                </label>
                            </div>
                            <div className="small text-secondary">Tips: Foto pertama akan menjadi cover utama.</div>
                        </div>

                        <div className="col-12 d-flex gap-2 pt-3">
                            <button disabled={saving} className="btn btn-dark btn-lg rounded-4 px-5 fw-bold">
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
