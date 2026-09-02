// functions/api/session.js
import { getCookie, verifySession } from './_crypto.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = getCookie(request, 'session');
  const data = await verifySession(token, env.SESSION_SECRET);
  return new Response(JSON.stringify({ loggedIn: !!data, username: data?.username || null }), {
    headers: { 'Content-Type': 'application/json' }
  });
}