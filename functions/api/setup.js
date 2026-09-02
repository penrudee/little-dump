// functions/api/setup.js
// เรียกใช้ "ครั้งเดียว" เพื่อตั้งค่าบัญชี admin เริ่มต้น หลังจากนั้นให้ใช้ /api/change-password แทน
import { generateSaltHex, hashPassword } from './_crypto.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // ป้องกันไม่ให้ใครก็ได้มาเรียก endpoint นี้ - ต้องรู้ SETUP_SECRET ที่ตั้งไว้ใน env variable ก่อน
  const providedSecret = request.headers.get('X-Setup-Secret');
  if (!env.SETUP_SECRET || providedSecret !== env.SETUP_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const existing = await env.AUTH_KV.get('admin_credentials');
  if (existing) {
    return new Response(JSON.stringify({ error: 'มีบัญชีผู้ดูแลอยู่แล้ว กรุณาใช้ /api/change-password แทน' }), {
      status: 409, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { username, password } = await request.json().catch(() => ({}));
  if (!username || !password || password.length < 8) {
    return new Response(JSON.stringify({ error: 'ต้องระบุ username และ password (อย่างน้อย 8 ตัวอักษร)' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const salt = generateSaltHex();
  const hash = await hashPassword(password, salt);

  await env.AUTH_KV.put('admin_credentials', JSON.stringify({ username, salt, hash }));

  return new Response(JSON.stringify({ ok: true, message: 'ตั้งค่าบัญชีผู้ดูแลเรียบร้อยแล้ว' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}