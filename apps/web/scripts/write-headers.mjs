// Gera dist/_headers (Cloudflare Pages) com CSP apontando para o Supabase do ambiente.
import fs from 'node:fs';
import path from 'node:path';

const supabase = (process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321').replace(/\/$/, '');
const ws = supabase.replace(/^http/, 'ws');
const csp = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${ws}`,
  'frame-src https://challenges.cloudflare.com',
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

const headers = `/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/sw.js
  Cache-Control: no-cache
`;

const dist = path.resolve(import.meta.dirname, '..', 'dist');
fs.writeFileSync(path.join(dist, '_headers'), headers);
fs.writeFileSync(path.join(dist, '_redirects'), '/*  /index.html  200\n');
console.log('dist/_headers e dist/_redirects gerados');
