// functions/api/_crypto.js
// ไฟล์ที่ขึ้นต้นด้วย "_" จะไม่ถูก Cloudflare Pages นำไปสร้างเป็น route
// ใช้เป็น shared module สำหรับไฟล์อื่นๆ ใน functions/api/ import ไปใช้

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function generateSaltHex() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return toHex(salt);
}

// PBKDF2: ปลอดภัยกว่าเก็บ plaintext มาก และ Cloudflare Workers runtime รองรับ Web Crypto API นี้ในตัว
export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = fromHex(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return toHex(derivedBits);
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const actualHashHex = await hashPassword(password, saltHex);
  if (actualHashHex.length !== expectedHashHex.length) return false;
  // constant-time compare กันเรื่อง timing attack
  let diff = 0;
  for (let i = 0; i < actualHashHex.length; i++) {
    diff |= actualHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}

async function getHmacKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

// session token แบบง่าย: base64(payload) + "." + HMAC signature (คล้าย JWT แบบย่อ)
export async function signSession(payloadObj, secret) {
  const payload = btoa(JSON.stringify(payloadObj));
  const key = await getHmacKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sigBuf)}`;
}

export async function verifySession(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  try {
    const key = await getHmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC', key, fromHex(sig), new TextEncoder().encode(payload)
    );
    if (!valid) return null;
    const data = JSON.parse(atob(payload));
    if (data.exp && Date.now() > data.exp) return null; // token หมดอายุ
    return data;
  } catch {
    return null;
  }
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}