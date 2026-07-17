import type { InstallatieSectionId } from '../storage/installatieData';

/** Beautiful 3D custom PNG icons located in the public directory. */
export const INSTALLATIE_CUSTOM_ICON_SRC: Record<InstallatieSectionId, string> = {
  ventilation: '/images/icons/installatie/ventilation.png',
  heating: '/images/icons/installatie/heating.png',
  tapwater: '/images/icons/installatie/tapwater.png',
  solar: '/images/icons/installatie/solar.png',
  cooling: '/images/icons/installatie/cooling.png',
};

export function InstallatieSectionIcon({
  section,
  selected,
}: {
  section: InstallatieSectionId;
  selected: boolean;
}) {
  const src = INSTALLATIE_CUSTOM_ICON_SRC[section];

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
        selected ? 'bg-primary/10 shadow-sm border border-primary/20 scale-105' : 'bg-gray-50 border border-transparent'
      }`}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        className={`h-10 w-10 object-contain transition-all duration-200 ${
          selected ? 'opacity-100' : 'opacity-50 grayscale-[20%]'
        }`}
      />
    </span>
  );
}
