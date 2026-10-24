import { isIP } from "node:net";

function ipv4ToInt(ip: string) {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const blockedV4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function inV4Range(ip: string, [base, bits]: [string, number]) {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

function expandV6(ip: string): number[] | null {
  let s = ip.toLowerCase().split("%")[0];
  // Trailing embedded IPv4 (e.g. ::ffff:10.0.0.1)
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = ipv4ToInt(v4[1]);
    s = s.replace(v4[1], `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`);
  }
  const [head, tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined && tail !== "" ? tail.split(":") : [];
  const fill = s.includes("::") ? 8 - h.length - t.length : 0;
  const parts = [...h, ...Array(fill).fill("0"), ...t].map((p) => parseInt(p || "0", 16));
  return parts.length === 8 && parts.every((p) => p >= 0 && p <= 0xffff) ? parts : null;
}

/** True for loopback, private, link-local, multicast and other non-public addresses. */
export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return blockedV4.some((r) => inV4Range(ip, r));
  if (kind === 6) {
    const p = expandV6(ip);
    if (!p) return true;
    if (p.every((x) => x === 0)) return true; // ::
    if (p.slice(0, 7).every((x) => x === 0) && p[7] === 1) return true; // ::1
    if ((p[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((p[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
    if ((p[0] & 0xff00) === 0xff00) return true; // multicast
    if (p[0] === 0x2001 && p[1] === 0x0db8) return true; // documentation
    const mapped = p.slice(0, 5).every((x) => x === 0) && (p[5] === 0xffff || p[5] === 0);
    if (mapped) {
      const v4 = `${p[6] >> 8}.${p[6] & 0xff}.${p[7] >> 8}.${p[7] & 0xff}`;
      return isPrivateAddress(v4);
    }
    if (p[0] === 0x0064 && p[1] === 0xff9b) {
      const v4 = `${p[6] >> 8}.${p[6] & 0xff}.${p[7] >> 8}.${p[7] & 0xff}`;
      return isPrivateAddress(v4);
    }
    return false;
  }
  return true;
}

export function isAllowedUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) return null;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local"))
    return null;
  if (isIP(host) && isPrivateAddress(host)) return null;
  return url;
}
