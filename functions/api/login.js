// functions/api/login.js
import { verifyPassword, signSession } from './_crypto.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const { username, password } = await request.json().catch(() => ({}));
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'กรุณากรอก username และ password' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const creds = await env.AUTH_KV.get('admin_credentials', 'json');
  if (!creds) {
    return new Response(JSON.stringify({ error: 'ยังไม่ได้ตั้งค่าบัญชีผู้ดูแล กรุณาเรียก /api/setup ก่อน' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  // ตอบกลับด้วยข้อความเดียวกันไม่ว่า username หรือ password จะผิด กัน user enumeration
  const genericError = () => new Response(JSON.stringify({ error: 'Username หรือ Password ไม่ถูกต้อง' }), {
    status: 401, headers: { 'Content-Type': 'application/json' }
  });

  if (username !== creds.username) return genericError();

  const ok = await verifyPassword(password, creds.salt, creds.hash);
  if (!ok) return genericError();

  const expiresInMs = 24 * 60 * 60 * 1000; // session อยู่ได้ 1 วัน
  const token = await signSession({ username, exp: Date.now() + expiresInMs }, env.SESSION_SECRET);

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      // HttpOnly = JS อ่านไม่ได้ (กัน XSS), Secure = ส่งผ่าน HTTPS เท่านั้น, SameSite=Strict = กัน CSRF
      'Set-Cookie': `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${expiresInMs / 1000}`
    }
  });
}