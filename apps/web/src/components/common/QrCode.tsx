import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function QrCode({ value, label, size = 220 }: { value: string; label: string; size?: number }) {
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    // carregado sob demanda: só quem paga via Pix baixa a biblioteca
    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' }))
      .then((url) => active && setSrc(url))
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [value, size]);
  if (!src) return <Skeleton style={{ width: size, height: size }} />;
  return <img src={src} width={size} height={size} alt={label} className="rounded-lg bg-white p-2" />;
}
