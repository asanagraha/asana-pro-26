import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/app/', '/api/', '/verify-email', '/onboarding'],
            },
        ],
        sitemap: 'https://asanapro.id/sitemap.xml',
    };
}