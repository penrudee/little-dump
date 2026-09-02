// functions/api/change-password.js
import { getCookie, verifySession, generateSaltHex, hashPassword } from './_crypto.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const token = getCookie(request, 'session');
  const session = await verifySession(token, env.SESSION_SECRET);
  if (!session) {
    return new Response(JSON.stringify({ error: 'กรุณาเข้าสู่ระบบก่อน' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { newPassword } = await request.json().catch(() => ({}));
  if (!newPassword || newPassword.length < 8) {
    return new Response(JSON.stringify({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const salt = generateSaltHex();
  const hash = await hashPassword(newPassword, salt);

  await env.AUTH_KV.put('admin_credentials', JSON.stringify({
    username: session.username,
    salt,
    hash
  }));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}