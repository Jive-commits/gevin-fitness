import { BottomNav } from '@/components/nav/bottom-nav';
import { MotionProvider } from '@/components/providers/motion-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <div className="mx-auto min-h-[100dvh] w-full max-w-xl">
        <div className="pb-[calc(76px+var(--safe-bottom))]">{children}</div>
        <BottomNav />
      </div>
    </MotionProvider>
  );
}
