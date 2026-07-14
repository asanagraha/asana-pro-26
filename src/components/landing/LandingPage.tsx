"use client";
import { useState } from 'react';
import Link from 'next/link';
import styles from './landing.module.css';

function Check() {
    return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M16.7 5.3 8.3 13.7 3.3 8.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

const NAV_LINKS = [
    { href: '#home', label: 'Home' },
    { href: '#produk', label: 'Product' },
    { href: '#harga', label: 'Harga' },
    { href: '#faq', label: 'FAQ' },
];

const PROBLEMS = [
    {
        title: 'Data Properti Berceceran & Bocor',
        text: 'Listingan berantakan di Excel, grup WhatsApp, hingga galeri HP. Tim bingung membedakan unit yang masih kosong, sudah di-booking, atau sudah terjual. Risiko double booking sangat tinggi.',
    },
    {
        title: 'Follow-Up Klien Tanpa Tracking',
        text: 'Tanpa catatan yang rapi, sulit tahu klien mana yang sudah disurvei, sudah dikirim penawaran, atau justru terlupakan. Telat follow-up sama saja menyerahkan komisi ke kompetitor.',
    },
    {
        title: 'Rekap Laporan Lambat & Bikin Ragu',
        text: 'Menyusun laporan penjualan dan keuangan manual menyita waktu dan rawan salah hitung. Sulit tampil profesional di mata pemilik properti atau investor jika data tidak real-time.',
    },
];

const FEATURES = [
    { title: 'Management Property', text: 'Semua listing properti dikelola dalam satu dashboard yang rapi dan mudah diakses.' },
    { title: 'CRM Klien', text: 'Menyimpan dan mengelola database klien secara profesional, lengkap dengan status leads.' },
    { title: 'Deal & Pembayaran', text: 'Update dan tracking pembayaran deal klien tanpa perlu hitung manual.' },
    { title: 'Sharing Link', text: 'Bagikan detail properti ke klien secara profesional lewat satu link, tanpa PDF besar.' },
];

const COMPARISON = [
    { label: 'Fokus Industri Properti', ap: true, trello: false, clickup: false, sheets: false },
    { label: 'CRM Properti', ap: true, trello: false, clickup: false, sheets: false },
    { label: 'Listing Management', ap: true, trello: false, clickup: false, sheets: false },
    { label: 'WhatsApp Sharing Link', ap: true, trello: false, clickup: false, sheets: false },
    { label: 'Monitoring Tim Marketing', ap: true, trello: true, clickup: true, sheets: false },
    { label: 'Laporan Keuangan Otomatis', ap: true, trello: false, clickup: true, sheets: false },
    { label: 'Mobile Friendly', ap: true, trello: true, clickup: true, sheets: true },
];

const PRICING = [
    {
        name: 'Paket Agency',
        desc: 'Untuk agen properti individu yang baru mulai.',
        price: 49000,
        features: [
            '1 akun Admin + 1 akun Marketing',
            'Hingga 10 listing properti aktif',
            'Hingga 50 data klien (CRM)',
            'Sharing link properti profesional',
            'Laporan keuangan dasar',
        ],
    },
    {
        name: 'Paket Profesional',
        desc: 'Untuk tim kecil yang mulai scaling closingan.',
        price: 125000,
        featured: true,
        features: [
            'Hingga 10 akun Marketing',
            'Hingga 50 listing properti aktif',
            'Hingga 100 data klien (CRM)',
            'Dashboard performa per marketing',
            'Laporan & analitik lengkap',
            'Sharing link properti profesional',
        ],
    },
    {
        name: 'Paket Business',
        desc: 'Untuk agensi skala besar & multi-cabang.',
        price: 199000,
        features: [
            'Akun Marketing unlimited',
            'Listing properti unlimited',
            'Data klien (CRM) unlimited',
            'Dashboard & leaderboard tim',
            'Laporan keuangan agensi penuh',
            'Prioritas dukungan teknis',
        ],
    },
];

const FAQS = [
    {
        q: 'Apakah AsanaPro hanya untuk perusahaan besar?',
        a: 'Tidak. AsanaPro dirancang fleksibel untuk agen independen perorangan, tim sales kecil, hingga agensi properti skala besar — tinggal pilih paket yang sesuai.',
    },
    {
        q: 'Apa bedanya AsanaPro dibanding Trello atau Google Sheets?',
        a: 'Trello dan Google Sheets adalah platform umum. AsanaPro dirancang khusus untuk bisnis properti sejak awal — listing, CRM, sharing link WhatsApp, hingga laporan keuangan sudah menyatu otomatis.',
    },
    {
        q: 'Apakah bisa digunakan oleh banyak agen dalam satu perusahaan?',
        a: 'Bisa. AsanaPro mendukung multi-user sehingga admin dapat memantau banyak marketing dalam satu sistem terpusat, lengkap dengan monitoring aktivitas dan pembagian role.',
    },
    {
        q: 'Bagaimana cara upgrade atau downgrade paket?',
        a: 'Kamu bisa mengganti paket kapan saja lewat halaman pengaturan akun. Perubahan langsung berlaku pada periode berikutnya.',
    },
];

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className={styles.page}>
            {/* NAVBAR */}
            <nav className={styles.nav}>
                <div className={styles.navInner}>
                    <Link href="/" className={styles.brand}>
                        <img src="/logo.jpg" alt="AsanaPro" width={34} height={34} style={{ objectFit: 'cover' }} />
                        AsanaPro
                    </Link>
                    <div className={styles.navLinks}>
                        {NAV_LINKS.map((l) => (
                            <a key={l.href} href={l.href}>{l.label}</a>
                        ))}
                    </div>
                    <div className={styles.navActions}>
                        <Link href="/login" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>Masuk</Link>
                        <Link href="/register" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}>Coba Gratis</Link>
                        <button className={styles.navToggle} onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
                            ☰
                        </button>
                    </div>
                </div>
                {menuOpen && (
                    <div className={styles.mobileMenu}>
                        {NAV_LINKS.map((l) => (
                            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
                        ))}
                    </div>
                )}
            </nav>

            {/* HERO */}
            <header id="home" className={`${styles.gradientSection} ${styles.hero}`}>
                <div className={styles.heroGrid}>
                    <div>
                        <span className={styles.eyebrow}>● Solusi Digital Agensi Properti</span>
                        <h1 className={styles.h1}>
                            Kelola Agensi Properti <span className={styles.accent}>Lebih Mudah</span>
                        </h1>
                        <p className={styles.lead}>
                            Stop buang waktu dengan sistem manual yang melelahkan. AsanaPro menyatukan
                            Listing Inventory, CRM Klien, hingga Professional Sharing Link agar tim Anda
                            bisa fokus mengejar closingan lebih cepat.
                        </p>
                        <div className={styles.heroActions}>
                            <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>Daftar Gratis Sekarang</Link>
                            <a href="#harga" className={`${styles.btn} ${styles.btnGhost}`}>Lihat Harga</a>
                        </div>
                        <div className={styles.heroBadges}>
                            <span><Check /> Listing Inventory</span>
                            <span><Check /> CRM Klien</span>
                            <span><Check /> Laporan Real-time</span>
                        </div>
                    </div>

                    <div className={styles.mockupWrap}>
                        <div className={styles.mockupStage}>
                            {/* Kartu utama: browser window */}
                            <div className={styles.browserWindow}>
                                <div className={styles.browserTop}>
                                    <span className={`${styles.trafficDot} ${styles.dotRed}`} />
                                    <span className={`${styles.trafficDot} ${styles.dotYellow}`} />
                                    <span className={`${styles.trafficDot} ${styles.dotGreen}`} />
                                    <div className={styles.urlBar}>🔒 app.asanpro.id/dashboard</div>
                                </div>

                                <div className={styles.dashHeader}>
                                    <h4>Dashboard Utama</h4>
                                    <p>Ringkasan real-time agensi Anda</p>
                                </div>

                                <div className={styles.mockupStats}>
                                    <div className={`${styles.statCard} ${styles.statTeal}`}>
                                        <div className={styles.statNum}>12</div>
                                        <div className={styles.statLabel}>Properti Aktif</div>
                                    </div>
                                    <div className={`${styles.statCard} ${styles.statRed}`}>
                                        <div className={styles.statNum}>8</div>
                                        <div className={styles.statLabel}>Terjual</div>
                                    </div>
                                    <div className={`${styles.statCard} ${styles.statDark}`}>
                                        <div className={styles.statNum}>4</div>
                                        <div className={styles.statLabel}>Disewa</div>
                                    </div>
                                    <div className={`${styles.statCard} ${styles.statDark}`}>
                                        <div className={styles.statNum}>34</div>
                                        <div className={styles.statLabel}>Total Klien</div>
                                    </div>
                                </div>

                                <div className={styles.dashListing}>
                                    <div className={styles.dashListingHead}>
                                        <span>Listing Terbaru</span>
                                        <span className={styles.dashListingLink}>Lihat Semua →</span>
                                    </div>
                                    <div className={styles.listingItem}>
                                        <span className={styles.listingIcon}>📍</span>
                                        <div>
                                            <b>Rumah Mewah Pondok Indah</b>
                                            <span>Dijual · Rp 4,5M</span>
                                        </div>
                                    </div>
                                    <div className={styles.listingItem}>
                                        <span className={styles.listingIcon}>📍</span>
                                        <div>
                                            <b>Apartemen Sudirman 2BR</b>
                                            <span>Disewa · Rp 8jt/bln</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.mockupFinance}>
                                    <div className={styles.financeRow}>
                                        <span>Total Revenue</span><b>Rp 202.000.000</b>
                                    </div>
                                    <div className={styles.financeRow}>
                                        <span>Net Profit</span><b>Rp 202.000.000</b>
                                    </div>
                                </div>
                            </div>

                            {/* Kartu mengambang: closing baru */}
                            <div className={`${styles.floatCard} ${styles.floatCard1}`}>
                                <div className={styles.floatIcon}>📈</div>
                                <div>
                                    <div className={styles.floatTitle}>Closing Baru!</div>
                                    <div className={styles.floatValue}>+Rp 6.200.000</div>
                                    <div className={styles.floatSub}>Komisi otomatis tercatat</div>
                                </div>
                            </div>

                            {/* Kartu mengambang: leaderboard */}
                            <div className={`${styles.floatCard} ${styles.floatCard2}`}>
                                <div className={styles.floatIcon}>🏆</div>
                                <div>
                                    <div className={styles.floatTitle}>Agen #1 Bulan Ini</div>
                                    <div className={styles.floatValue}>Siti Rahayu</div>
                                    <div className={styles.floatSub}>5 listing · 3 closing</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* PROBLEM */}
            <section id="masalah" className={styles.section} style={{ background: '#050914' }}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <div className={styles.sectionEyebrow}>Tantangan Umum</div>
                        <h2 className={styles.h2}>Familiar dengan Masalah Ini?</h2>
                        <p className={styles.sub}>Tiga hal yang paling sering menghambat agen dan agensi properti berkembang.</p>
                    </div>
                    <div className={styles.grid3}>
                        {PROBLEMS.map((p) => (
                            <div key={p.title} className={styles.card}>
                                <div className={styles.cardIcon}>⚠️</div>
                                <div className={styles.cardTitle}>{p.title}</div>
                                <div className={styles.cardText}>{p.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WORKFLOW SPLIT */}
            <section className={styles.section} style={{ background: '#050914' }}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <div className={styles.sectionEyebrow}>Untuk Siapa</div>
                        <h2 className={styles.h2}>Pilihan Workflow Sesuai Peran Anda</h2>
                    </div>
                    <div className={styles.splitGrid}>
                        <div className={`${styles.splitCard} ${styles.teal}`}>
                            <div className={styles.splitTitle}>👤 Khusus Agen Properti Mandiri</div>
                            <ul className={styles.splitList}>
                                <li><b>Personal Inventory Hub</b>Simpan semua listingan di satu tempat aman. Ubah status unit (Available, Booking, Sold) hanya hitungan detik.</li>
                                <li><b>Simple Personal CRM</b>Pantau status leads (New, Prospect, Hot, Deal) agar tahu siapa yang harus dihubungi duluan.</li>
                                <li><b>Instant Sharing Link</b>Kirim satu link bersih, klien langsung lihat foto dan detail properti.</li>
                                <li><b>Personal Deal Tracker</b>Catat riwayat pembayaran dan estimasi komisi tanpa rumus Excel rumit.</li>
                            </ul>
                        </div>
                        <div className={`${styles.splitCard} ${styles.purple}`}>
                            <div className={styles.splitTitle}>👥 Tim In-House & Owner Agency</div>
                            <ul className={styles.splitList}>
                                <li><b>Multi-User & Marketing Monitoring</b>Monitor aktivitas dan performa banyak marketing dari satu dashboard terpusat.</li>
                                <li><b>Centralized Enterprise CRM</b>Data klien aman di sistem perusahaan, tidak hilang saat ada marketing resign.</li>
                                <li><b>Agency Financial Overview</b>Pantau total uang masuk, komisi, hingga net profit secara otomatis.</li>
                                <li><b>Real-Time Analytics Dashboard</b>Grafik perkembangan proyek yang rapi untuk rapat dengan direksi atau investor.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="produk" className={styles.section} style={{ background: '#050914' }}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <div className={styles.sectionEyebrow}>Fitur Utama</div>
                        <h2 className={styles.h2}>Satu Platform, Semua Kebutuhan Agensi</h2>
                    </div>
                    <div className={styles.grid4}>
                        {FEATURES.map((f) => (
                            <div key={f.title} className={styles.card}>
                                <div className={styles.cardIcon}>✦</div>
                                <div className={styles.cardTitle}>{f.title}</div>
                                <div className={styles.cardText}>{f.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* COMPARISON */}
            <section className={styles.section} style={{ background: '#050914' }}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <div className={styles.sectionEyebrow}>Perbandingan</div>
                        <h2 className={styles.h2}>Dirancang Khusus untuk Properti, Bukan Tools Umum</h2>
                        <p className={styles.sub}>AsanaPro bukan sekadar tools manajemen biasa, tapi ekosistem digital properti agar tim Anda fokus pada satu hal: closing.</p>
                    </div>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Fitur</th>
                                    <th>AsanaPro</th>
                                    <th>Trello</th>
                                    <th>ClickUp</th>
                                    <th>Google Sheets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.map((row) => (
                                    <tr key={row.label}>
                                        <td>{row.label}</td>
                                        <td className={row.ap ? 'yes' : 'no'}>{row.ap ? '✓ Ya' : '— Tidak'}</td>
                                        <td className={row.trello ? 'yes' : 'no'}>{row.trello ? '✓ Ya' : '— Tidak'}</td>
                                        <td className={row.clickup ? 'yes' : 'no'}>{row.clickup ? '✓ Ya' : '— Tidak'}</td>
                                        <td className={row.sheets ? 'yes' : 'no'}>{row.sheets ? '✓ Ya' : '— Tidak'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="harga" className={styles.section} style={{ background: '#050914' }}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <div className={styles.sectionEyebrow}>Harga</div>
                        <h2 className={styles.h2}>Paket yang Tumbuh Bersama Bisnis Anda</h2>
                        <p className={styles.sub}>Mulai dari agen mandiri sampai agensi skala besar — pilih sesuai kebutuhan tim.</p>
                    </div>
                    <div className={styles.pricingGrid}>
                        {PRICING.map((plan) => (
                            <div key={plan.name} className={`${styles.priceCard} ${plan.featured ? styles.featured : ''}`}>
                                {plan.featured && <span className={styles.priceBadge}>Paling Populer</span>}
                                <div className={styles.priceName}>{plan.name}</div>
                                <div className={styles.priceDesc}>{plan.desc}</div>
                                <div className={styles.priceValue}>
                                    Rp{plan.price.toLocaleString('id-ID')}<span> /bulan</span>
                                </div>
                                <ul className={styles.priceList}>
                                    {plan.features.map((f) => (
                                        <li key={f}><Check /> {f}</li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register"
                                    className={`${styles.btn} ${plan.featured ? styles.btnPrimary : styles.btnGhost}`}
                                    style={{ width: '100%' }}
                                >
                                    Mulai Sekarang
                                </Link>
                            </div>
                        ))}
                    </div>
                    <p className={styles.priceNote}>
                        🎉 Saat ini AsanaPro masih dalam masa <b>Early Access</b> — semua paket dapat diakses gratis penuh selama masa promosi. Harga di atas akan berlaku setelah periode early access berakhir.
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className={styles.section} style={{ background: '#050914' }}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <div className={styles.sectionEyebrow}>FAQ</div>
                        <h2 className={styles.h2}>Pertanyaan yang Sering Diajukan</h2>
                    </div>
                    <div className={styles.faqGrid}>
                        {FAQS.map((f) => (
                            <div key={f.q} className={styles.faqItem}>
                                <div className={styles.faqQ}>{f.q}</div>
                                <div className={styles.faqA}>{f.a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={`${styles.gradientSection} ${styles.ctaSection}`} id="contact">
                <h2 className={styles.ctaTitle}>Ubah Gaya Kerjamu Sekarang</h2>
                <p className={styles.ctaText}>
                    AsanaPro adalah ekosistem digital yang dirancang demi kemudahan, kecepatan, dan
                    kenyamanan bisnis properti Anda.
                </p>
                <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>Daftar Agensi Gratis</Link>
            </section>

            {/* FOOTER */}
            <footer className={styles.footer}>
                &copy; 2026 AsanaPro. Mobile-first Property Management.
            </footer>
        </div>
    );
}