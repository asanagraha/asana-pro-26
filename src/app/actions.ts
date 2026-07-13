'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { UserRole } from '@prisma/client'
import { sendVerificationEmail, sendMarketingWelcomeEmail, generateOTP } from '@/lib/email'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me')

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export async function loginUser(prevState: any, formData: FormData) {
    const email = (formData.get('email') as string).toLowerCase().trim()
    const pin = (formData.get('pin') as string).trim()

    if (!email || !pin) return { message: 'Email dan PIN wajib diisi' }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { agency: true }
        })

        if (!user) return { message: 'User tidak ditemukan' }

        const isValid = await bcrypt.compare(pin, user.password)
        if (!isValid) return { message: 'PIN salah' }

        // Block ADMIN who has not verified email yet
        if (user.role === UserRole.ADMIN && !user.emailVerified) {
            // Re-send OTP and store pending verification in cookie
            const otp = generateOTP()
            const expiry = new Date(Date.now() + 10 * 60 * 1000)
            await prisma.user.update({
                where: { id: user.id },
                data: { verificationToken: otp, verificationExpiry: expiry }
            })
            const pendingData = JSON.stringify({ userId: user.id, email: user.email, name: user.name })
                ; (await cookies()).set('pending_verification', pendingData, {
                    httpOnly: true,
                    maxAge: 60 * 15,
                    path: '/',
                    sameSite: 'lax',
                })
            await sendVerificationEmail(user.email, otp, user.name)
            return { message: 'Email Anda belum diverifikasi. Kode OTP baru telah dikirim ke email Anda.', needsVerification: true }
        }

        const token = await new SignJWT({
            userId: user.id,
            email: user.email,
            role: user.role,
            agencyId: user.agencyId
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('365d')
            .sign(SECRET_KEY)

            ; (await cookies()).set('session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 365,
                path: '/',
                sameSite: 'lax',
            })
    } catch (e) {
        console.error(e)
        return { message: 'Server error' }
    }

    redirect('/app/dashboard')
}

export async function getSession() {
    try {
        const sessionToken = (await cookies()).get('session')?.value
        if (!sessionToken) return null

        const { payload } = await jwtVerify(sessionToken, SECRET_KEY)
        const user = await prisma.user.findUnique({
            where: { id: payload.userId as string },
            select: {
                id: true,
                email: true,
                name: true,
                phoneNumber: true,
                role: true,
                agencyId: true,
                agency: { select: { id: true, name: true, address: true } },
                updatedAt: true
            }
        })
        return user
    } catch {
        return null
    }
}

// Legacy alias for components still using getMe
export async function getMe() {
    return getSession()
}

async function logActivity(session: any, action: string, details?: string) {
    if (!session) return;
    try {
        await prisma.activityLog.create({
            data: {
                action,
                details,
                userId: session.id,
                agencyId: session.agencyId
            }
        });
    } catch (e) {
        console.error("Failed to log activity:", e);
    }
}

export async function logoutAgent() {
    ; (await cookies()).delete('session')
    redirect('/')
}

export async function registerAgency(prevState: any, formData: FormData) {
    const agencyName = (formData.get('agency') as string).trim()
    const name = (formData.get('name') as string).trim()
    const email = (formData.get('email') as string).toLowerCase().trim()
    const pin = (formData.get('pin') as string).trim()
    const phoneNumber = formData.get('phone') as string

    if (!agencyName || !name || !email || !pin) return { message: 'Semua field wajib diisi' }
    if (pin.length < 6) return { message: 'PIN minimal 6 karakter' }

    let userId: string | null = null

    try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return { message: 'Email sudah terdaftar' }

        const hashedPassword = await bcrypt.hash(pin, 10)
        const otp = generateOTP()
        const expiry = new Date(Date.now() + 10 * 60 * 1000)

        const agency = await prisma.agency.create({
            data: {
                name: agencyName,
                users: {
                    create: {
                        name,
                        email,
                        password: hashedPassword,
                        phoneNumber,
                        role: UserRole.ADMIN,
                        emailVerified: false,
                        verificationToken: otp,
                        verificationExpiry: expiry,
                    }
                }
            },
            include: { users: true }
        })

        userId = agency.users[0]?.id || null

        // Store pending verification data in cookie (15 min)
        const pendingData = JSON.stringify({ userId, email, name })
            ; (await cookies()).set('pending_verification', pendingData, {
                httpOnly: true,
                maxAge: 60 * 15,
                path: '/',
                sameSite: 'lax',
            })

        // Send OTP email
        const emailResult = await sendVerificationEmail(email, otp, name)
        if (!emailResult.success) {
            console.warn('Email sending failed, but user created. OTP:', otp)
        }
    } catch (e) {
        console.error(e)
        return { message: `Gagal mendaftar: ${(e as any)?.message || 'Unknown error'}` }
    }

    redirect('/verify-email')
}

export async function verifyOTP(prevState: any, formData: FormData) {
    const otp = (formData.get('otp') as string)?.trim()
    if (!otp) return { message: 'Kode OTP wajib diisi' }

    try {
        const cookieStore = await cookies()
        const pendingRaw = cookieStore.get('pending_verification')?.value
        if (!pendingRaw) return { message: 'Sesi verifikasi tidak ditemukan. Silakan daftar ulang.' }

        const pending = JSON.parse(pendingRaw) as { userId: string; email: string; name: string }

        const user = await prisma.user.findUnique({
            where: { id: pending.userId }
        })

        if (!user) return { message: 'User tidak ditemukan.' }
        if (user.emailVerified) {
            cookieStore.delete('pending_verification')
            return { message: 'Email sudah diverifikasi sebelumnya. Silakan login.' }
        }
        if (!user.verificationToken || user.verificationToken !== otp) {
            return { message: 'Kode OTP salah. Silakan coba lagi.' }
        }
        if (user.verificationExpiry && new Date() > user.verificationExpiry) {
            return { message: 'Kode OTP telah kedaluwarsa. Silakan kirim ulang.' }
        }

        // Mark as verified and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationExpiry: null,
            }
        })

        // Clear pending cookie
        cookieStore.delete('pending_verification')
    } catch (e) {
        console.error(e)
        return { message: 'Terjadi kesalahan. Silakan coba lagi.' }
    }

    redirect('/login?verified=1')
}

export async function resendOTP() {
    try {
        const cookieStore = await cookies()
        const pendingRaw = cookieStore.get('pending_verification')?.value
        if (!pendingRaw) return { success: false, message: 'Sesi verifikasi tidak ditemukan.' }

        const pending = JSON.parse(pendingRaw) as { userId: string; email: string; name: string }

        const user = await prisma.user.findUnique({ where: { id: pending.userId } })
        if (!user) return { success: false, message: 'User tidak ditemukan.' }
        if (user.emailVerified) return { success: false, message: 'Email sudah diverifikasi.' }

        const otp = generateOTP()
        const expiry = new Date(Date.now() + 10 * 60 * 1000)

        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken: otp, verificationExpiry: expiry }
        })

        // Refresh cookie expiry
        cookieStore.set('pending_verification', pendingRaw, {
            httpOnly: true,
            maxAge: 60 * 15,
            path: '/',
            sameSite: 'lax',
        })

        const emailResult = await sendVerificationEmail(user.email, otp, user.name)
        if (!emailResult.success) {
            return { success: false, message: 'Gagal mengirim email. Coba lagi.' }
        }

        return { success: true, message: 'Kode OTP baru telah dikirim ke email Anda.' }
    } catch (e) {
        console.error(e)
        return { success: false, message: 'Terjadi kesalahan server.' }
    }
}

export async function getPendingVerificationUser() {
    try {
        const cookieStore = await cookies()
        const pendingRaw = cookieStore.get('pending_verification')?.value
        if (!pendingRaw) return null
        const pending = JSON.parse(pendingRaw) as { userId: string; email: string; name: string }
        return { email: pending.email, name: pending.name }
    } catch {
        return null
    }
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

export async function getSettings() {
    return await getSession()
}

export async function updateSettings(prevState: any, formData: FormData) {
    const user = await getSession()
    if (!user) return { message: 'Unauthorized' }

    const name = formData.get('name') as string
    const phoneNumber = formData.get('phone') as string
    const agencyName = formData.get('agencyName') as string

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { name, phoneNumber }
        })
        if (agencyName && user.role === UserRole.ADMIN) {
            await prisma.agency.update({
                where: { id: user.agencyId },
                data: { name: agencyName }
            })
        }
        revalidatePath('/app/settings')
        return { message: 'Profil berhasil diperbarui' }
    } catch (e) {
        console.error(e)
        return { message: 'Gagal memperbarui profil' }
    }
}

export async function changePassword(prevState: any, formData: FormData) {
    const user = await getSession()
    if (!user) return { message: 'Unauthorized' }

    const oldPin = formData.get('oldPin') as string
    const newPin = formData.get('newPin') as string

    try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (!dbUser) return { message: 'User tidak ditemukan' }

        const isValid = await bcrypt.compare(oldPin, dbUser.password)
        if (!isValid) return { message: 'PIN lama salah' }

        const hashed = await bcrypt.hash(newPin, 10)
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
        return { message: 'PIN berhasil diubah' }
    } catch {
        return { message: 'Gagal mengubah PIN' }
    }
}

// ─────────────────────────────────────────────
// TEAM (Admin only)
// ─────────────────────────────────────────────

export async function getTeamMembers() {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return []

    try {
        const members = await prisma.user.findMany({
            where: { agencyId: session.agencyId, role: UserRole.MARKETING },
            include: {
                _count: { select: { clients: true, deals: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        return members
    } catch {
        return []
    }
}

export async function createMarketingUser(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return { success: false, message: 'Unauthorized' }

    const name = (formData.get('name') as string).trim()
    const email = (formData.get('email') as string).toLowerCase().trim()
    const pin = (formData.get('pin') as string).trim()
    const phoneNumber = formData.get('phone') as string

    if (!name || !email || !pin) return { success: false, message: 'Semua field wajib diisi' }

    try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return { success: false, message: 'Email sudah terdaftar' }

        const hashedPassword = await bcrypt.hash(pin, 10)
        await prisma.user.create({
            data: {
                name, email,
                password: hashedPassword,
                phoneNumber,
                role: UserRole.MARKETING,
                agencyId: session.agencyId,
                emailVerified: true, // Marketing langsung aktif, tidak perlu verifikasi
            }
        })

        // Kirim email selamat datang dengan tautan login dan kredensial
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://asanapro.id'
        const loginUrl = `${appUrl}/login`
        const agencyName = session.agency?.name || 'AsanaPro Agency'
        await sendMarketingWelcomeEmail(email, name, agencyName, pin, loginUrl)

        revalidatePath('/app/admin/team')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, message: 'Gagal membuat user' }
    }
}

export async function deleteMarketingUser(id: string) {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.user.delete({ where: { id, agencyId: session.agencyId } })
        revalidatePath('/app/admin/team')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menghapus user' }
    }
}

// ─────────────────────────────────────────────
// PROPERTIES
// ─────────────────────────────────────────────

export async function getProperties() {
    const session = await getSession()
    if (!session) return []

    try {
        return await prisma.property.findMany({
            where: { agencyId: session.agencyId },
            include: { images: true, _count: { select: { deals: true } } },
            orderBy: { createdAt: 'desc' }
        })
    } catch {
        return []
    }
}

export async function getProperty(id: string) {
    const session = await getSession()
    if (!session) return null

    try {
        return await prisma.property.findFirst({
            where: { id, agencyId: session.agencyId },
            include: {
                images: true,
                deals: {
                    include: {
                        client: true,
                        marketing: { select: { name: true } },
                        payments: { orderBy: { paidAt: 'asc' } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                addedBy: { select: { name: true, phoneNumber: true } }
            }
        })
    } catch {
        return null
    }
}

export async function getPublicProperty(id: string) {
    try {
        const prop = await prisma.property.findUnique({
            where: { id },
            include: {
                images: true,
                addedBy: { select: { name: true, phoneNumber: true } },
                agency: { select: { name: true, users: { where: { role: 'ADMIN' }, select: { name: true, phoneNumber: true } } } }
            }
        })
        if (!prop) return null;

        const admin = prop.agency?.users?.[0];
        const defaultName = admin?.name || 'Agen';
        const defaultPhone = admin?.phoneNumber || '';

        return {
            ...prop,
            agent: {
                name: prop.addedBy?.name || defaultName,
                phoneNumber: prop.addedBy?.phoneNumber || defaultPhone,
                agency: prop.agency?.name || 'AsanaPro Agent'
            }
        }
    } catch {
        return null
    }
}

export async function createProperty(formData: FormData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const imagesRaw = formData.get('images') as string
    const images = JSON.parse(imagesRaw || '[]')

    try {
        const prop = await prisma.property.create({
            data: {
                title: formData.get('title') as string,
                price: parseFloat(formData.get('price') as string),
                location: formData.get('location') as string,
                description: formData.get('description') as string,
                propertyType: (formData.get('propertyType') as any) || 'HOUSE',
                landArea: parseFloat(formData.get('landArea') as string) || undefined,
                buildingArea: parseFloat(formData.get('buildingArea') as string) || undefined,
                yearBuilt: parseInt(formData.get('yearBuilt') as string) || undefined,
                legality: formData.get('legality') as string || undefined,
                certificate: formData.get('certificate') as string || undefined,
                features: formData.get('features') as string || undefined,
                agencyId: session.agencyId,
                addedById: session.id,
                images: { create: images.map((url: string) => ({ url })) }
            }
        })
        await logActivity(session, "Menambahkan Properti", `Menambahkan properti: ${prop.title}`);
        revalidatePath('/app/listing')
        return { success: true, propertyId: prop.id }
    } catch (e) {
        console.error(e)
        return { success: false, message: 'Gagal membuat properti' }
    }
}

export async function updateProperty(id: string, formData: FormData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.property.update({
            where: { id, agencyId: session.agencyId },
            data: {
                title: formData.get('title') as string,
                price: parseFloat(formData.get('price') as string),
                location: formData.get('location') as string,
                description: formData.get('description') as string,
                propertyType: (formData.get('propertyType') as any) || 'HOUSE',
                status: (formData.get('status') as any) || 'AVAILABLE',
                landArea: parseFloat(formData.get('landArea') as string) || undefined,
                buildingArea: parseFloat(formData.get('buildingArea') as string) || undefined,
                yearBuilt: parseInt(formData.get('yearBuilt') as string) || undefined,
                legality: formData.get('legality') as string || undefined,
                certificate: formData.get('certificate') as string || undefined,
                features: formData.get('features') as string || undefined,
            }
        })

        const imagesRaw = formData.get('images') as string
        if (imagesRaw) {
            const images = JSON.parse(imagesRaw || '[]')
            await prisma.propertyImage.deleteMany({ where: { propertyId: id } })
            if (images.length > 0) {
                await prisma.propertyImage.createMany({
                    data: images.map((url: string) => ({ url, propertyId: id }))
                })
            }
        }

        await logActivity(session, "Mengubah Properti", `Mengubah properti ID: ${id}`);
        revalidatePath(`/app/listing/${id}`)
        revalidatePath('/app/listing')
        return { success: true }
    } catch (e) {
        return { success: false, message: 'Gagal update properti' }
    }
}

export async function deleteProperty(id: string) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.property.delete({ where: { id, agencyId: session.agencyId } })
        revalidatePath('/app/listing')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menghapus properti' }
    }
}

// ─────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────

export async function getClients(marketingId?: string) {
    const session = await getSession()
    if (!session) return []

    try {
        // Admin bisa lihat semua klien dalam agency; Marketing hanya milik sendiri
        let where: any
        if (session.role === UserRole.ADMIN) {
            where = marketingId
                ? { marketingId, marketing: { agencyId: session.agencyId } }
                : { marketing: { agencyId: session.agencyId } }
        } else {
            where = { marketingId: session.id }
        }

        return await prisma.client.findMany({
            where,
            include: {
                marketing: { select: { name: true } },
                _count: { select: { followUps: true, deals: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
    } catch {
        return []
    }
}

export async function getClient(id: string) {
    const session = await getSession()
    if (!session) return null

    try {
        const where = session.role === UserRole.ADMIN
            ? { id, marketing: { agencyId: session.agencyId } }
            : { id, marketingId: session.id }

        return await prisma.client.findFirst({
            where,
            include: {
                marketing: { select: { name: true, phoneNumber: true } },
                followUps: { orderBy: { createdAt: 'desc' } },
                deals: {
                    include: {
                        property: { select: { title: true, location: true } },
                        payments: { orderBy: { paidAt: 'asc' } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
    } catch {
        return null
    }
}

export async function createClient(formData: FormData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        const client = await prisma.client.create({
            data: {
                name: formData.get('name') as string,
                whatsapp: formData.get('whatsapp') as string,
                email: formData.get('email') as string || undefined,
                status: (formData.get('status') as any) || 'NEW',
                notes: formData.get('notes') as string || undefined,
                propertyType: formData.get('propertyType') as string || undefined,
                locationPreference: formData.get('locationPreference') as string || undefined,
                minBudget: formData.get('minBudget') ? parseFloat(formData.get('minBudget') as string) : undefined,
                maxBudget: formData.get('maxBudget') ? parseFloat(formData.get('maxBudget') as string) : undefined,
                marketingId: session.id
            }
        })
        await logActivity(session, "Menambahkan Klien", `Menambahkan klien: ${client.name}`);
        revalidatePath('/app/crm')
        return { success: true, clientId: client.id }
    } catch (e) {
        return { success: false, message: 'Gagal membuat klien' }
    }
}

export async function updateClient(id: string, formData: FormData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        const where = session.role === UserRole.ADMIN
            ? { id }
            : { id, marketingId: session.id }

        await prisma.client.update({
            where,
            data: {
                name: formData.get('name') as string || undefined,
                whatsapp: formData.get('whatsapp') as string || undefined,
                email: formData.get('email') as string || undefined,
                status: (formData.get('status') as any) || undefined,
                notes: formData.get('notes') as string || undefined,
                propertyType: formData.get('propertyType') as string || undefined,
                locationPreference: formData.get('locationPreference') as string || undefined,
                minBudget: formData.get('minBudget') ? parseFloat(formData.get('minBudget') as string) : undefined,
                maxBudget: formData.get('maxBudget') ? parseFloat(formData.get('maxBudget') as string) : undefined,
            }
        })
        revalidatePath(`/app/crm/${id}`)
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal update klien' }
    }
}

export async function deleteClient(id: string) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        const where = session.role === UserRole.ADMIN
            ? { id }
            : { id, marketingId: session.id }
        await prisma.client.delete({ where })
        revalidatePath('/app/crm')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menghapus klien' }
    }
}

// ─────────────────────────────────────────────
// FOLLOW UPS
// ─────────────────────────────────────────────

export async function addFollowUp(clientId: string, formData: FormData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        const followUpDateRaw = formData.get('followUpDate') as string
        await prisma.followUp.create({
            data: {
                content: formData.get('content') as string,
                type: (formData.get('type') as any) || 'WHATSAPP',
                followUpDate: followUpDateRaw ? new Date(followUpDateRaw) : undefined,
                clientId
            }
        })
        await logActivity(session, "Follow Up Klien", `Tipe: ${formData.get('type') || 'WHATSAPP'}`);
        revalidatePath(`/app/crm/${clientId}`)
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menambah follow-up' }
    }
}

export async function deleteFollowUp(id: string, clientId: string) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.followUp.delete({ where: { id } })
        revalidatePath(`/app/crm/${clientId}`)
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menghapus follow-up' }
    }
}

// ─────────────────────────────────────────────
// DEALS
// ─────────────────────────────────────────────

export async function getDeals() {
    const session = await getSession()
    if (!session) return []

    try {
        const where = session.role === UserRole.ADMIN
            ? { marketing: { agencyId: session.agencyId } }
            : { marketingId: session.id }

        return await prisma.deal.findMany({
            where,
            include: {
                property: { select: { title: true, location: true } },
                client: { select: { name: true, whatsapp: true } },
                marketing: { select: { name: true } },
                payments: true,
                _count: { select: { payments: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
    } catch {
        return []
    }
}

export async function getDeal(id: string) {
    const session = await getSession()
    if (!session) return null

    try {
        const where = session.role === UserRole.ADMIN
            ? { id, marketing: { agencyId: session.agencyId } }
            : { id, marketingId: session.id }

        return await prisma.deal.findFirst({
            where,
            include: {
                property: { select: { id: true, title: true, location: true, price: true } },
                client: { select: { id: true, name: true, whatsapp: true } },
                marketing: { select: { name: true } },
                payments: { orderBy: { paidAt: 'asc' } }
            }
        })
    } catch {
        return null
    }
}

export async function createDeal(formData: FormData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const dealPrice = parseFloat(formData.get('dealPrice') as string)
    const totalInstallments = parseInt(formData.get('totalInstallments') as string) || 1
    const paymentStartRaw = formData.get('paymentStartDate') as string
    const rentStartRaw = formData.get('rentStartDate') as string
    const rentEndRaw = formData.get('rentEndDate') as string

    try {
        const deal = await prisma.deal.create({
            data: {
                dealType: (formData.get('dealType') as any) || 'SALE',
                dealPrice,
                totalInstallments,
                paymentStartDate: paymentStartRaw ? new Date(paymentStartRaw) : undefined,
                notes: formData.get('notes') as string || undefined,
                rentStartDate: rentStartRaw ? new Date(rentStartRaw) : undefined,
                rentEndDate: rentEndRaw ? new Date(rentEndRaw) : undefined,
                propertyId: formData.get('propertyId') as string,
                clientId: formData.get('clientId') as string,
                marketingId: session.id
            }
        })
        // Update property status
        const dealType = formData.get('dealType') as string
        await prisma.property.update({
            where: { id: formData.get('propertyId') as string },
            data: { status: dealType === 'SALE' ? 'SOLD' : 'RENTED' }
        })
        await logActivity(session, "Menambahkan Deal", `Tipe: ${dealType}, Harga: ${dealPrice}`);
        revalidatePath('/app/deals')
        revalidatePath('/app/listing')
        return { success: true, dealId: deal.id }
    } catch (e) {
        console.error(e)
        return { success: false, message: 'Gagal membuat deal' }
    }
}

export async function updateDeal(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const dealPriceRaw = formData.get('dealPrice') as string;
    const dealPrice = parseFloat(dealPriceRaw);
    const totalInstallments = parseInt(formData.get('totalInstallments') as string) || undefined;
    const paymentStartRaw = formData.get('paymentStartDate') as string;
    const rentStartRaw = formData.get('rentStartDate') as string;
    const rentEndRaw = formData.get('rentEndDate') as string;

    try {
        await prisma.deal.update({
            where: { id },
            data: {
                dealType: (formData.get('dealType') as any) || undefined,
                dealPrice: isNaN(dealPrice) ? undefined : dealPrice,
                totalInstallments,
                paymentStartDate: paymentStartRaw ? new Date(paymentStartRaw) : undefined,
                notes: formData.get('notes') as string || undefined,
                rentStartDate: rentStartRaw ? new Date(rentStartRaw) : undefined,
                rentEndDate: rentEndRaw ? new Date(rentEndRaw) : undefined,
            }
        });

        const dealType = formData.get('dealType') as string;
        if (dealType) {
            const deal = await prisma.deal.findUnique({ where: { id }, select: { propertyId: true } });
            if (deal) {
                await prisma.property.update({
                    where: { id: deal.propertyId },
                    data: { status: dealType === 'SALE' ? 'SOLD' : 'RENTED' }
                });
            }
        }

        const dealInfo = await prisma.deal.findUnique({
            where: { id },
            include: { payments: true }
        });
        if (dealInfo) {
            const totalPaid = dealInfo.payments.reduce((s: number, p: any) => s + p.amount, 0);
            let newStatus = 'PENDING';
            if (totalPaid >= dealInfo.dealPrice) newStatus = 'COMPLETED';
            else if (totalPaid > 0) newStatus = 'IN_PROGRESS';

            if (dealInfo.paymentStatus !== newStatus) {
                await prisma.deal.update({ where: { id }, data: { paymentStatus: newStatus as any } });
            }
        }

        revalidatePath('/app/deals');
        return { success: true };
    } catch (e) {
        return { success: false, message: 'Gagal update deal' };
    }
}


export async function updateDealStatus(id: string, status: string) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.deal.update({
            where: { id },
            data: { status: status as any }
        })
        revalidatePath('/app/deals')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal update status deal' }
    }
}

export async function deleteDeal(id: string) {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.deal.delete({ where: { id } })
        revalidatePath('/app/deals')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menghapus deal' }
    }
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export async function addPayment(formData: FormData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const dealId = formData.get('dealId') as string
    const paidAtRaw = formData.get('paidAt') as string

    try {
        await prisma.payment.create({
            data: {
                amount: parseFloat(formData.get('amount') as string),
                paymentType: (formData.get('paymentType') as any) || 'FULL_PAYMENT',
                paymentMethod: (formData.get('paymentMethod') as any) || 'TRANSFER',
                installmentNumber: formData.get('installmentNumber') ? parseInt(formData.get('installmentNumber') as string) : undefined,
                paidAt: paidAtRaw ? new Date(paidAtRaw) : new Date(),
                notes: formData.get('notes') as string || undefined,
                dealId
            }
        })

        // Kalkulasi ulang status pembayaran Deal
        const dealInfo = await prisma.deal.findUnique({
            where: { id: dealId },
            include: { payments: true }
        })
        if (dealInfo) {
            const totalPaid = dealInfo.payments.reduce((s: number, p: any) => s + p.amount, 0)
            let newStatus = 'PENDING'
            if (totalPaid >= dealInfo.dealPrice) {
                newStatus = 'COMPLETED'
            } else if (totalPaid > 0) {
                newStatus = 'IN_PROGRESS'
            }
            if (dealInfo.paymentStatus !== newStatus) {
                await prisma.deal.update({
                    where: { id: dealId },
                    data: { paymentStatus: newStatus as any }
                })
            }
        }

        await logActivity(session, "Menambahkan Pembayaran", `Nominal: ${formData.get('amount')}, Tipe: ${formData.get('paymentType') || 'FULL_PAYMENT'}`);
        revalidatePath('/app/deals')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menambah pembayaran' }
    }
}

export async function deletePayment(id: string, dealId: string) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.payment.delete({ where: { id } })

        const dealInfo = await prisma.deal.findUnique({
            where: { id: dealId },
            include: { payments: true }
        });
        if (dealInfo) {
            const totalPaid = dealInfo.payments.reduce((s: number, p: any) => s + p.amount, 0);
            let newStatus = 'PENDING';
            if (totalPaid >= dealInfo.dealPrice) newStatus = 'COMPLETED';
            else if (totalPaid > 0) newStatus = 'IN_PROGRESS';

            if (dealInfo.paymentStatus !== newStatus) {
                await prisma.deal.update({ where: { id: dealId }, data: { paymentStatus: newStatus as any } });
            }
        }

        revalidatePath('/app/deals')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menghapus pembayaran' }
    }
}

export async function updatePayment(id: string, dealId: string, formData: FormData) {
    const session = await getSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const amountRaw = formData.get('amount') as string;
    const amount = parseFloat(amountRaw);
    const paidAtRaw = formData.get('paidAt') as string;

    try {
        await prisma.payment.update({
            where: { id },
            data: {
                amount: isNaN(amount) ? undefined : amount,
                paymentType: (formData.get('paymentType') as any) || undefined,
                paymentMethod: (formData.get('paymentMethod') as any) || undefined,
                installmentNumber: formData.get('installmentNumber') ? parseInt(formData.get('installmentNumber') as string) : undefined,
                paidAt: paidAtRaw ? new Date(paidAtRaw) : undefined,
                notes: formData.get('notes') as string || undefined,
            }
        });

        // Kalkulasi ulang status pembayaran Deal
        const dealInfo = await prisma.deal.findUnique({
            where: { id: dealId },
            include: { payments: true }
        });
        if (dealInfo) {
            const totalPaid = dealInfo.payments.reduce((s: number, p: any) => s + p.amount, 0);
            let newStatus = 'PENDING';
            if (totalPaid >= dealInfo.dealPrice) newStatus = 'COMPLETED';
            else if (totalPaid > 0) newStatus = 'IN_PROGRESS';

            if (dealInfo.paymentStatus !== newStatus) {
                await prisma.deal.update({
                    where: { id: dealId },
                    data: { paymentStatus: newStatus as any }
                });
            }
        }

        revalidatePath('/app/deals');
        return { success: true };
    } catch {
        return { success: false, message: 'Gagal update pembayaran' };
    }
}


// ─────────────────────────────────────────────
// EXPENSES (Admin only)
// ─────────────────────────────────────────────

export async function getExpenses() {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return []

    try {
        return await prisma.agencyExpense.findMany({
            where: { agencyId: session.agencyId },
            orderBy: { expenseDate: 'desc' }
        })
    } catch {
        return []
    }
}

export async function createExpense(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.agencyExpense.create({
            data: {
                amount: parseFloat(formData.get('amount') as string),
                description: formData.get('description') as string,
                category: (formData.get('category') as any) || 'OPERATIONAL',
                expenseDate: new Date(formData.get('expenseDate') as string),
                agencyId: session.agencyId
            }
        })
        revalidatePath('/app/admin/finance')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menambah pengeluaran' }
    }
}

export async function deleteExpense(id: string) {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.agencyExpense.delete({ where: { id, agencyId: session.agencyId } })
        revalidatePath('/app/admin/finance')
        return { success: true }
    } catch {
        return { success: false, message: 'Gagal menghapus pengeluaran' }
    }
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export async function getDashboardData() {
    const session = await getSession()
    if (!session) return null

    try {
        if (session.role === UserRole.ADMIN) {
            // Admin dashboard: full agency view
            const [
                totalProperties, availableProperties, soldProperties, rentedProperties,
                totalClients, totalDeals, completedDeals,
                allDeals, expenses, recentDeals
            ] = await Promise.all([
                prisma.property.count({ where: { agencyId: session.agencyId } }),
                prisma.property.count({ where: { agencyId: session.agencyId, status: 'AVAILABLE' } }),
                prisma.property.count({ where: { agencyId: session.agencyId, status: 'SOLD' } }),
                prisma.property.count({ where: { agencyId: session.agencyId, status: 'RENTED' } }),
                prisma.client.count({ where: { marketing: { agencyId: session.agencyId } } }),
                prisma.deal.count({ where: { marketing: { agencyId: session.agencyId } } }),
                prisma.deal.count({ where: { marketing: { agencyId: session.agencyId }, status: 'COMPLETED' } }),
                prisma.deal.findMany({
                    where: { marketing: { agencyId: session.agencyId } },
                    include: { marketing: { select: { name: true, id: true } }, payments: true }
                }),
                prisma.agencyExpense.findMany({ where: { agencyId: session.agencyId } }),
                prisma.deal.findMany({
                    where: { marketing: { agencyId: session.agencyId } },
                    include: {
                        property: { select: { title: true } },
                        client: { select: { name: true } },
                        marketing: { select: { name: true } },
                        payments: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                })
            ])

            const totalPaid = allDeals.reduce((sum: number, d: any) => sum + d.payments.reduce((s: number, p: any) => s + p.amount, 0), 0)
            const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
            const netProfit = totalPaid - totalExpenses // asumsi profit = semua uang masuk dikurang pengeluaran

            // Leaderboard
            const leaderboard: Record<string, { name: string; deals: number; revenue: number }> = {}
            for (const d of allDeals) {
                const mid = d.marketing.id
                if (!leaderboard[mid]) leaderboard[mid] = { name: d.marketing.name, deals: 0, revenue: 0 }
                if (d.status === 'COMPLETED') {
                    leaderboard[mid].deals++
                }
                leaderboard[mid].revenue += d.payments.reduce((s: number, p: any) => s + p.amount, 0)
            }
            const leaderboardArr = Object.values(leaderboard).sort((a: any, b: any) => b.revenue - a.revenue)

            return {
                role: 'ADMIN',
                stats: { totalProperties, availableProperties, soldProperties, rentedProperties, totalClients, totalDeals, completedDeals },
                finance: { totalPaid, totalExpenses, netProfit },
                leaderboard: leaderboardArr,
                recentDeals
            }
        } else {
            // Marketing dashboard
            const [
                myClients, hotClients, dealClients,
                myDeals, completedDeals,
                upcomingFollowUps
            ] = await Promise.all([
                prisma.client.count({ where: { marketingId: session.id } }),
                prisma.client.count({ where: { marketingId: session.id, status: 'HOT' } }),
                prisma.client.count({ where: { marketingId: session.id, status: 'DEAL' } }),
                prisma.deal.count({ where: { marketingId: session.id } }),
                prisma.deal.count({ where: { marketingId: session.id, status: 'COMPLETED' } }),
                prisma.followUp.findMany({
                    where: {
                        client: { marketingId: session.id },
                        followUpDate: { gte: new Date() }
                    },
                    include: { client: { select: { name: true, id: true } } },
                    orderBy: { followUpDate: 'asc' },
                    take: 5
                })
            ])

            const myDealsFull = await prisma.deal.findMany({
                where: { marketingId: session.id },
                include: { payments: true }
            })
            const totalPaid = myDealsFull.reduce((sum: number, d: any) => sum + d.payments.reduce((s: number, p: any) => s + p.amount, 0), 0)

            return {
                role: 'MARKETING',
                stats: { myClients, hotClients, dealClients, myDeals, completedDeals },
                finance: { totalPaid },
                upcomingFollowUps
            }
        }
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function getAdminReports() {
    const session = await getSession()
    if (!session || session.role !== UserRole.ADMIN) return null

    try {
        const [deals, expenses, marketingUsers] = await Promise.all([
            prisma.deal.findMany({
                where: { marketing: { agencyId: session.agencyId } },
                include: {
                    property: { select: { title: true, location: true } },
                    client: { select: { name: true } },
                    marketing: { select: { name: true, id: true } },
                    payments: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.agencyExpense.findMany({
                where: { agencyId: session.agencyId },
                orderBy: { expenseDate: 'desc' }
            }),
            prisma.user.findMany({
                where: { agencyId: session.agencyId, role: UserRole.MARKETING },
                include: {
                    _count: { select: { clients: true, deals: true } }
                }
            })
        ])

        // Per-marketing stats
        const mktStats: Record<string, any> = {}
        for (const u of marketingUsers) {
            mktStats[u.id] = { name: u.name, clients: u._count.clients, deals: 0, revenue: 0 }
        }
        for (const d of deals) {
            if (!mktStats[d.marketing.id]) mktStats[d.marketing.id] = { name: d.marketing.name, clients: 0, deals: 0, revenue: 0 }
            if (d.status === 'COMPLETED') {
                mktStats[d.marketing.id].deals++
            }
            mktStats[d.marketing.id].revenue += d.payments.reduce((s: number, p: any) => s + p.amount, 0)
        }

        const totalPaid = deals.reduce((sum: number, d: any) => sum + d.payments.reduce((s: number, p: any) => s + p.amount, 0), 0)
        const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0)

        return {
            deals,
            expenses,
            marketingStats: Object.values(mktStats),
            summary: { totalPaid, totalExpenses, netProfit: totalPaid - totalExpenses }
        }
    } catch (e) {
        console.error(e)
        return null
    }
}

// ─────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────
export async function getActivityLogs(marketingId?: string) {
    const session = await getSession()
    if (!session) return []

    try {
        const where: any = { agencyId: session.agencyId }
        if (session.role === 'MARKETING') {
            where.userId = session.id
        } else if (marketingId) {
            where.userId = marketingId
        }

        return await prisma.activityLog.findMany({
            where,
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        })
    } catch {
        return []
    }
}

// ─────────────────────────────────────────────
// unused legacy stubs (keep to avoid import errors during migration)
// ─────────────────────────────────────────────
export async function getReportStats() { return null }
export async function createReport() { return { success: false } }
export async function deleteReport() { return { success: false } }
export async function loginAgent(p: any, f: FormData) { return loginUser(p, f) }
export async function registerAgent(p: any, f: FormData) { return registerAgency(p, f) }
