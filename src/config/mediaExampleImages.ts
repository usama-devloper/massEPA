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
  'WOONKAMER|Heating control panel': 'Woonkamer_Heating control panel.jpg',
  'WOONKAMER|Ventilation panel': 'Woonkamer_Ventilatie panel.jpg',
  'SLAAPKAMER|Window': 'Slaapkamer_Window.jpg',
  'SLAAPKAMER|Heating system': 'Slaapkamer_Heating system.jpg',
  'KEUKEN|Window': 'Keuken_Window.jpg',
  'KEUKEN|CO₂ sensor': 'Keuken_Co2 sensor.jpg',
  'BADKAMER|Window': 'Badkamer_Window.jpg',
  'BADKAMER|Heating system': 'Badkamer_Heating system.jpg',
  'HAL|Doors': 'Hal_Doors.jpg',
  'HAL|Window': 'Hal_Window.jpg',
  'MK|Heating system - merk & type': 'MK_Heating systeem.jpg',
  'MK|PV system - merk & type': 'MK_PV systeem.jpg',
  'WC|Window': 'WC_Window.jpg',
  'BERGING|General View': 'Berging_General view.jpg',
  'TECHNICAL ROOM|General View': 'Technical_room_General view.jpg',
  'EETKAMER|Window': 'Eetkamer_Window.jpg',
  'AANBOUW|General View': 'Aanbouw_General view.jpg',
  'ZOLDER|General View': 'Zolder_General view.jpg',
  'ZOLDER|Roof windows': 'Zolder_Roof windows.jpg',
  'SERRE|General View': 'Serre_General view.jpg',
  'WASRUIMTE|General View': 'Wasruimte.jpg',
};

export function photoInteriorExampleImageUrl(
  roomName: string,
  category: string,
): string | undefined {
  const key = `${getPhotoCaptureRoomKey(roomName)}|${getPhotoCaptureCategoryBase(category)}`;
  const filename = INTERIOR_EXAMPLE_FILES[key];
  if (!filename) return undefined;
  return `${INTERIOR_EXAMPLE_BASE}${encodeURI(filename)}`;
}
