import type { MediaInstructionScreen, MediaInstructionVariant } from './mediaInstructions';
import { getPhotoCaptureRoomKey, getPhotoCaptureCategoryBase } from '../utils/photoCaptureRooms';

/** Example photos for Capture Assistant — one image per screen (camera & upload share it). */
const SCREEN_EXAMPLE_IMAGES: Partial<Record<MediaInstructionScreen, string>> = {
  upload: '/images/examples/house-design/plattegrond.jpg',
  kozijn: '/images/examples/kozijn/documentatie.jpg',
};

export function mediaExampleImageUrl(
  screen: MediaInstructionScreen,
  _variant?: MediaInstructionVariant,
): string | undefined {
  return SCREEN_EXAMPLE_IMAGES[screen];
}

export const EXTERIOR_SECTION_IDS = ['voor', 'achter', 'links', 'rechts'] as const;
export type ExteriorSectionId = (typeof EXTERIOR_SECTION_IDS)[number];

const EXTERIOR_EXAMPLE_IMAGES: Record<ExteriorSectionId, string> = {
  voor: '/images/examples/photos/exterior/voor.jpg',
  achter: '/images/examples/photos/exterior/achter.jpg',
  links: '/images/examples/photos/exterior/links.jpg',
  rechts: '/images/examples/photos/exterior/rechts.jpg',
};

export function photoExteriorExampleImageUrl(sectionId: string): string | undefined {
  if (!(sectionId in EXTERIOR_EXAMPLE_IMAGES)) return undefined;
  return EXTERIOR_EXAMPLE_IMAGES[sectionId as ExteriorSectionId];
}

const INTERIOR_EXAMPLE_BASE = '/images/examples/photos/interior/';

/** Maps normalized room + app category → filename in public/images/examples/photos/interior/ */
const INTERIOR_EXAMPLE_FILES: Record<string, string> = {
  'WOONKAMER|Full room view': 'Woonkamer_Full room view.jpg',
  'WOONKAMER|Windows': 'Woonkamer_Window.jpg',
  'WOONKAMER|Heating control panel': 'Heating control panel.jpg',
  'WOONKAMER|Ventilation panel': 'Ventilation panel.jpg',
  'WOONKAMER|Heating system': 'Heating afgiftesystem.jpg',
  'WOONKAMER|Heating afgiftesystem': 'Heating afgiftesystem.jpg',

  'SLAAPKAMER|Window': 'Slaapkamer_Window.jpg',
  'SLAAPKAMER|Heating system': 'Heating afgiftesystem.jpg',
  'SLAAPKAMER|Heating afgiftesystem': 'Heating afgiftesystem.jpg',
  'SLAAPKAMER|Ventilation grill': 'Ventilation grill.jpg',

  'KEUKEN|Window': 'Keuken_Window.jpg',
  'KEUKEN|CO₂ sensor': 'Keuken_Co2 sensor.jpg',
  'KEUKEN|Heating system': 'Heating afgiftesystem.jpg',
  'KEUKEN|Heating afgiftesystem': 'Heating afgiftesystem.jpg',
  'KEUKEN|Ventilation grill': 'Ventilation grill.jpg',

  'BADKAMER|Window': 'Badkamer_Window.jpg',
  'BADKAMER|Heating system': 'Heating afgiftesystem.jpg',
  'BADKAMER|Heating afgiftesystem': 'Heating afgiftesystem.jpg',
  'BADKAMER|Ventilation grill': 'Ventilation grill.jpg',

  'HAL|Doors': 'Hal_Doors.jpg',
  'HAL|Window': 'Hal_Window.jpg',
  'HAL|Crawl space': 'Hal_Kruipruimte.jpg',
  'HAL|Heating system': 'Heating afgiftesystem.jpg',
  'HAL|Heating afgiftesystem': 'Heating afgiftesystem.jpg',

  'MK|Heating system - merk & type': 'Heating system - brand & type.jpeg',
  'MK|Heating system - brand & type': 'Heating system - brand & type.jpeg',
  'MK|PV system - merk & type': 'PV system - brand & type.jpg',
  'MK|PV system - brand & type': 'PV system - brand & type.jpg',

  'WC|Window': 'WC_Window.jpg',
  'WC|Heating system': 'Heating afgiftesystem.jpg',
  'WC|Heating afgiftesystem': 'Heating afgiftesystem.jpg',
  'WC|Ventilation grill': 'Ventilation grill.jpg',

  'BERGING|General View': 'Berging_General view.jpg',

  'TECHNICAL ROOM|General View': 'Technical_room_General view.jpg',
  'TECHNICAL ROOM|Installation': 'Installation.jpg',

  'EETKAMER|Window': 'Eetkamer_Window.jpg',
  'EETKAMER|Heating system': 'Heating afgiftesystem.jpg',
  'EETKAMER|Heating afgiftesystem': 'Heating afgiftesystem.jpg',

  'AANBOUW|General View': 'Aanbouw_General view.jpg',

  'ZOLDER|General View': 'Zolder_General view.jpg',
  'ZOLDER|Roof windows': 'Zolder_Roof windows.jpg',
  'ZOLDER|Heating system': 'Heating afgiftesystem.jpg',
  'ZOLDER|Heating afgiftesystem': 'Heating afgiftesystem.jpg',

  'SERRE|General View': 'Serre_General view.jpg',
  'WASRUIMTE|General View': 'Wasruimte.jpg',
  'OVERLUIP|General View': 'Overloop_General view.jpg',
};

/** Category-level fallbacks when a specific room combination isn't explicitly listed */
const CATEGORY_DEFAULT_FILES: Record<string, string> = {
  'Heating control panel': 'Heating control panel.jpg',
  'Ventilation panel': 'Ventilation panel.jpg',
  'Ventilation grill': 'Ventilation grill.jpg',
  'Installation': 'Installation.jpg',
  'Heating system': 'Heating afgiftesystem.jpg',
  'Heating afgiftesystem': 'Heating afgiftesystem.jpg',
  'Heating system - merk & type': 'Heating system - brand & type.jpeg',
  'Heating system - brand & type': 'Heating system - brand & type.jpeg',
  'PV system - merk & type': 'PV system - brand & type.jpg',
  'PV system - brand & type': 'PV system - brand & type.jpg',
};

export function photoInteriorExampleImageUrl(
  roomName: string,
  category: string,
): string | undefined {
  const categoryBase = getPhotoCaptureCategoryBase(category);
  const key = `${getPhotoCaptureRoomKey(roomName)}|${categoryBase}`;
  const filename = INTERIOR_EXAMPLE_FILES[key] ?? CATEGORY_DEFAULT_FILES[categoryBase];
  if (!filename) return undefined;
  return `${INTERIOR_EXAMPLE_BASE}${encodeURI(filename)}`;
}
