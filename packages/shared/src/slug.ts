export const RESERVED_SLUGS = new Set([
  'painel', 'entrar', 'cadastro', 'r', 'auth', 'api', 'app', 'admin', 'assets', 'static',
  'recuperar-senha', 'redefinir-senha', 'termos', 'privacidade', 'sobre', 'ajuda', 'reserva',
]);

export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)
    .replace(/-+$/g, '');
}
