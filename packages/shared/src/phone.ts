/**
 * Normaliza telefones para E.164 (+5511999998888).
 * Aceita formatos brasileiros comuns ("(11) 99999-8888", "11999998888",
 * "+55 11 99999-8888") e internacionais já com "+".
 * Retorna null quando não é possível obter um número válido.
 */
export function normalizePhone(input: string, defaultCountry = '55'): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const hasPlus = raw.startsWith('+');
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (!hasPlus) {
    // remove prefixo de discagem nacional (0) e de operadora (0XX)
    if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
    if (defaultCountry === '55') {
      if (digits.length === 10 || digits.length === 11) {
        digits = `55${digits}`;
      } else if (!(digits.startsWith('55') && (digits.length === 12 || digits.length === 13))) {
        return null;
      }
    } else {
      digits = `${defaultCountry}${digits}`;
    }
  }

  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;

  if (digits.startsWith('55')) {
    const national = digits.slice(2);
    // DDD válido (11–99) e 8 ou 9 dígitos; celular com 9 dígitos começa com 9
    if (!/^[1-9][1-9]\d{8,9}$/.test(national)) return null;
    if (national.length === 11 && national[2] !== '9') return null;
  }
  return `+${digits}`;
}

/** Formata E.164 brasileiro para exibição: +5511999998888 → (11) 99999-8888 */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return '';
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(e164);
  if (m) return `(${m[1]}) ${m[2]}-${m[3]}`;
  return e164;
}

/** Dígitos para links wa.me */
export function phoneDigits(e164: string): string {
  return e164.replace(/\D/g, '');
}
