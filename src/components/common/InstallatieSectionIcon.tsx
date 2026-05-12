import type { LucideIcon } from 'lucide-react';
import { Flame, Snowflake, Wind } from 'lucide-react';
import type { InstallatieSectionId } from '../storage/installatieData';

const INSTALLATIE_LUCIDE_ICONS: Record<
  Exclude<InstallatieSectionId, 'tapwater' | 'solar'>,
  LucideIcon
> = {
  ventilation: Wind,
  heating: Flame,
  cooling: Snowflake,
};

/** Custom PNG icons (white line art on black — tinted via CSS on light backgrounds). */
export const INSTALLATIE_CUSTOM_ICON_SRC: Partial<Record<InstallatieSectionId, string>> = {
  tapwater: '/images/icons/installatie/tapwater.png',
  solar: '/images/icons/installatie/solar.png',
};

const CUSTOM_ICON_SELECTED_FILTER =
  'brightness(0) saturate(100%) invert(32%) sepia(28%) saturate(1200%) hue-rotate(105deg) brightness(0.85)';
const CUSTOM_ICON_UNSELECTED_FILTER =
  'brightness(0) saturate(100%) invert(55%) sepia(8%) saturate(300%) hue-rotate(60deg)';

export function InstallatieSectionIcon({
  section,
  selected,
}: {
  section: InstallatieSectionId;
  selected: boolean;
}) {
  const customSrc = INSTALLATIE_CUSTOM_ICON_SRC[section];

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
        selected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
      }`}
      aria-hidden
    >
      {customSrc ? (
        <img
          src={customSrc}
          alt=""
          className={`h-[22px] w-[22px] object-contain transition-opacity ${
            selected ? '' : 'opacity-75'
          }`}
          style={{
            filter: selected ? CUSTOM_ICON_SELECTED_FILTER : CUSTOM_ICON_UNSELECTED_FILTER,
          }}
        />
      ) : (
        (() => {
          const Icon = INSTALLATIE_LUCIDE_ICONS[section as keyof typeof INSTALLATIE_LUCIDE_ICONS];
          return Icon ? <Icon size={20} strokeWidth={2} /> : null;
        })()
      )}
    </span>
  );
}
