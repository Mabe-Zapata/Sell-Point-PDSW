import axios from 'axios';

type RequestLike = {
  ip?: string;
  ips?: string[];
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
};

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const normalizeIp = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  let ip = value.trim();
  if (!ip) return undefined;

  const commaIndex = ip.indexOf(',');
  if (commaIndex >= 0) ip = ip.slice(0, commaIndex).trim();

  if (ip.startsWith('"') && ip.endsWith('"')) ip = ip.slice(1, -1).trim();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);

  const zoneIndex = ip.indexOf('%');
  if (zoneIndex >= 0) ip = ip.slice(0, zoneIndex);

  return ip || undefined;
};

const isIpv4 = (value: string): boolean => IPV4_REGEX.test(value);

const isPrivateOrReservedIpv4 = (value: string): boolean => {
  const [a, b] = value.split('.').map(Number);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a >= 224) return true;
  return false;
};

export const extractPublicIpv4 = (request: RequestLike): string | undefined => {
  const candidates: string[] = [];

  const pushHeader = (key: string) => {
    const raw = request.headers?.[key.toLowerCase()];
    if (Array.isArray(raw)) {
      candidates.push(...raw);
      return;
    }
    if (typeof raw === 'string' && raw.trim()) candidates.push(...raw.split(','));
  };

  pushHeader('x-forwarded-for');
  pushHeader('x-real-ip');
  pushHeader('cf-connecting-ip');
  pushHeader('true-client-ip');
  pushHeader('x-client-ip');

  candidates.push(...(request.ips ?? []), request.ip ?? '', request.socket?.remoteAddress ?? '');

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (!ip || !isIpv4(ip) || isPrivateOrReservedIpv4(ip)) continue;
    return ip;
  }

  return undefined;
};

const getExternalIpTimeoutMs = (): number => {
  const raw = process.env.PUBLIC_IP_TIMEOUT_MS ?? process.env.EXTERNAL_IP_TIMEOUT_MS ?? '1500';
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1500;
};

const fetchExternalPublicIpv4 = async (): Promise<string | undefined> => {
  try {
    const { data } = await axios.get<{ ip?: string }>('https://api.ipify.org?format=json', {
      timeout: getExternalIpTimeoutMs(),
      headers: { Accept: 'application/json' },
    });

    const ip = normalizeIp(data?.ip);
    if (!ip || !isIpv4(ip) || isPrivateOrReservedIpv4(ip)) return undefined;
    return ip;
  } catch {
    return undefined;
  }
};

export const resolvePublicIpv4 = async (request: RequestLike): Promise<string | undefined> => {
  return extractPublicIpv4(request) ?? (await fetchExternalPublicIpv4());
};
