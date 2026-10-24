// Helpers de segurança compartilhados pelas funções de backend.
//
// 1) Códigos que funcionam como credencial (voucher, resgate, selo, indicação) são
//    gerados com crypto.getRandomValues — Math.random é previsível e não serve.
// 2) escapeHtml neutraliza dados digitados por usuários antes de entrarem em
//    e-mails em HTML, evitando phishing dentro de mensagens oficiais do app.

export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const secureCode = (length, chars = CODE_CHARS) => {
  const limit = Math.floor(256 / chars.length) * chars.length;
  const out = [];
  while (out.length < length) {
    const bytes = new Uint8Array(length - out.length);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < limit) out.push(chars[byte % chars.length]);
    }
  }
  return out.join('');
};

export const secureIndex = (max) => {
  const size = Math.floor(Number(max) || 0);
  if (size <= 1) return 0;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % size;
};

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));