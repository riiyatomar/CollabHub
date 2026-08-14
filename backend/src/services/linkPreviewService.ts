import dns from 'dns/promises';

export class LinkPreviewService {
  /**
   * Safely fetches a link preview by checking DNS to prevent SSRF against internal IP addresses.
   */
  static async getPreview(url: string) {
    try {
      const parsedUrl = new URL(url);
      
      // Do not allow local/private IPs or metadata services
      const host = parsedUrl.hostname;
      if (
        host === 'localhost' ||
        host === '169.254.169.254' ||
        host.startsWith('127.') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.')
      ) {
        throw new Error('Invalid or internal URL');
      }

      // Optionally resolve DNS to verify the resolved IP is not private
      const addresses = await dns.resolve4(host).catch(() => []);
      for (const ip of addresses) {
        if (
          ip === '169.254.169.254' ||
          ip.startsWith('127.') ||
          ip.startsWith('10.') ||
          ip.startsWith('192.168.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
        ) {
          throw new Error('SSRF attempt blocked');
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'CollabHubBot/1.0' } });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch URL');
      const text = await response.text();

      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : host;

      const descMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                        text.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
      const description = descMatch ? descMatch[1] : '';

      const imageMatch = text.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                         text.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
      const thumbnail = imageMatch ? imageMatch[1] : '';

      return {
        title,
        description,
        thumbnail,
        domain: host,
        url
      };
    } catch (error) {
      console.error('Link preview failed for URL:', url, error);
      return null;
    }
  }
}
