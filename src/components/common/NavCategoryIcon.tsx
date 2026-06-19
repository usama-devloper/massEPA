import type { ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  AppWindow,
  BadgeCheck,
  Scroll,
  Camera,
  ClipboardCheck,
  Cog,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { Step } from '../../types';

/** Installaties: cog + wrench (icons-only preview). */
export function InstallatieNavIcon({ size = 16, className = '', ...props }: LucideProps) {
  const wrenchSize = Math.max(10, Math.round(size * 0.58));
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Cog size={size} strokeWidth={2} {...props} />
      <Wrench
        size={wrenchSize}
        strokeWidth={2.25}
        className="absolute -right-px -bottom-px"
        {...props}
      />
    </span>
  );
}

type NavIconRenderer = (props: LucideProps) => ReactNode;

const NAV_ICONS: Partial<Record<Step, NavIconRenderer>> = {
  [Step.HOME]: (p) => <Home {...p} />,
  [Step.DASHBOARD]: (p) => <LayoutDashboard {...p} />,
  [Step.CLIENTS]: (p) => <Users {...p} />,
  [Step.ALGEMEEN]: (p) => <LayoutGrid {...p} />,
  [Step.UPLOAD]: (p) => <Scroll {...p} />,
  [Step.INSULATION_DETAILS]: (p) => <Layers {...p} />,
  [Step.INSTALLATIE]: (p) => <InstallatieNavIcon {...p} />,
  [Step.KOZIJN_GLAS]: (p) => <AppWindow {...p} />,
  [Step.PHOTO_CAPTURE]: (p) => <Camera {...p} />,
  [Step.PHOTO_INTERIOR]: (p) => <Camera {...p} />,
  [Step.FINAL_REVIEW]: (p) => <ClipboardCheck {...p} />,
  [Step.COMPLETE]: (p) => <BadgeCheck {...p} />,
  [Step.SETTINGS]: (p) => <Settings {...p} />,
};

export function NavCategoryIcon({
  step,
  size = 16,
  className,
  ...props
}: LucideProps & { step: Step }) {
  const render = NAV_ICONS[step];
  if (!render) return null;
  return <>{render({ size, className, strokeWidth: 2, ...props })}</>;
}

/** Dashboard wizard steps shown on progress overview. */
export const DASHBOARD_PROGRESS_STEPS: Step[] = [
  Step.ALGEMEEN,
  Step.UPLOAD,
  Step.INSULATION_DETAILS,
  Step.INSTALLATIE,
  Step.PHOTO_CAPTURE,
  Step.COMPLETE,
];

export function dashboardCategoryIcon(step: Step, size = 16): ReactNode {
  return <NavCategoryIcon step={step} size={size} />;
}
