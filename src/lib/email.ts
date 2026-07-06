import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, otp: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing in environment variables');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    console.log(`Attempting to send verification email to: ${email}`);
    const { data, error } = await resend.emails.send({
      from: "AsanaPro <noreply@asanapro.id>",
      to: [email],
      subject: 'Verifikasi Email Anda - AsanaPro',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifikasi Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">AsanaPro</h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Property Management System</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Halo, ${name}! 👋</h2>
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Terima kasih telah mendaftar di AsanaPro. Untuk melanjutkan, silakan verifikasi email Anda dengan kode OTP berikut:
                        </p>
                        
                        <!-- OTP Code -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center" style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
                              <div style="font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                                ${otp}
                              </div>
                              <p style="margin: 15px 0 0 0; color: #999999; font-size: 13px;">
                                Kode ini berlaku selama 10 menit
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Jika Anda tidak melakukan pendaftaran ini, abaikan email ini.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                          © 2026 AsanaPro. Property Management System
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendMarketingWelcomeEmail(
  email: string,
  name: string,
  agencyName: string,
  pin: string,
  loginUrl: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing in environment variables');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    console.log(`Sending marketing welcome email to: ${email}`);
    const { data, error } = await resend.emails.send({
      from: "AsanaPro <noreply@asanapro.id>",
      to: [email],
      subject: `Selamat Datang di AsanaPro - ${agencyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Selamat Datang di AsanaPro</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">AsanaPro</h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Property Management System</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 10px 0; color: #333333; font-size: 24px; font-weight: 600;">Selamat Datang, ${name}! 🎉</h2>
                        <p style="margin: 0 0 24px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                          Anda telah ditambahkan sebagai <strong>Marketing</strong> di agensi <strong>${agencyName}</strong>. Akun Anda sudah aktif dan siap digunakan.
                        </p>

                        <!-- Credentials Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0; background-color: #f8f9fa; border-radius: 10px; border-left: 4px solid #11998e;">
                          <tr>
                            <td style="padding: 24px 28px;">
                              <p style="margin: 0 0 6px 0; color: #888888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Informasi Akun</p>
                              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
                                <tr>
                                  <td style="color: #666666; font-size: 14px; padding: 4px 0; width: 100px;">Email</td>
                                  <td style="color: #333333; font-size: 14px; font-weight: 600; padding: 4px 0;">${email}</td>
                                </tr>
                                <tr>
                                  <td style="color: #666666; font-size: 14px; padding: 4px 0;">PIN</td>
                                  <td style="color: #333333; font-size: 14px; font-weight: 600; padding: 4px 0; font-family: 'Courier New', monospace; letter-spacing: 2px;">${pin}</td>
                                </tr>
                                <tr>
                                  <td style="color: #666666; font-size: 14px; padding: 4px 0;">Agensi</td>
                                  <td style="color: #333333; font-size: 14px; font-weight: 600; padding: 4px 0;">${agencyName}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
                          <tr>
                            <td align="center">
                              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 40px; border-radius: 50px; box-shadow: 0 4px 15px rgba(17,153,142,0.3);">
                                🚀 Login ke AsanaPro
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6; text-align: center;">
                          Atau salin tautan ini ke browser Anda:<br>
                          <a href="${loginUrl}" style="color: #11998e; word-break: break-all;">${loginUrl}</a>
                        </p>

                        <p style="margin: 24px 0 0 0; color: #ff6b6b; font-size: 13px; line-height: 1.6; text-align: center;">
                          ⚠️ Segera ganti PIN Anda setelah login pertama untuk keamanan akun.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                          © 2026 AsanaPro. Property Management System<br>
                          Email ini dikirim secara otomatis, mohon tidak membalas email ini.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending marketing welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending marketing welcome email:', error);
    return { success: false, error };
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
