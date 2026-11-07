import { RequireAuth } from '@/features/auth/RequireAuth';
import { PanelRoot } from './PanelLayout';

export default function PanelRoute() {
  return (
    <RequireAuth>
      <PanelRoot />
    </RequireAuth>
  );
}
