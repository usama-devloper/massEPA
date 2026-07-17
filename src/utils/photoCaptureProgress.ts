import {
  loadHouseDesignAlgemeenHints,
  loadHouseDesignPageRaw,
} from '../storage/houseDesignPageData';
import type { ExteriorPhotos, InteriorPhotos } from '../storage/photoCaptureData';
import { buildInteriorFloorSections, getSelectedRoomsForFloor } from './interiorRoomsFromUpload';
import { buildPhotoCaptureCategoryList } from './photoCaptureRooms';

const EXTERIOR_IDS = ['voor', 'achter', 'links', 'rechts'] as const;

export type PhotoCaptureProgressStats = {
  completed: number;
  total: number;
  progress: number;
};

/** Dashboard progress: 4 exterior views + 1 per interior room from House design. */
export function computePhotoCaptureProgress(
  exterior: ExteriorPhotos,
  interior: InteriorPhotos,
): PhotoCaptureProgressStats {
  const exteriorTotal = EXTERIOR_IDS.length;
  const exteriorCompleted = EXTERIOR_IDS.filter((id) => (exterior[id]?.length ?? 0) > 0).length;

  const selection = loadHouseDesignPageRaw();
  const { numberOfFloors, hasKelder, startFloorKey } = loadHouseDesignAlgemeenHints();
  const floors = buildInteriorFloorSections(numberOfFloors, hasKelder, startFloorKey);

  let interiorTotal = 0;
  let interiorCompleted = 0;

  for (const floor of floors) {
    for (const room of getSelectedRoomsForFloor(selection, floor)) {
      const roomId = `${floor}_${room}`;
      const categories = buildPhotoCaptureCategoryList(room, roomId, {}, interior, {});
      if (categories.length === 0) continue;

      interiorTotal += 1;
      const categoriesWithPhotos = categories.filter(
        (category) => (interior[roomId]?.[category]?.length ?? 0) > 0,
      ).length;
      if (categoriesWithPhotos === categories.length) {
        interiorCompleted += 1;
      }
    }
  }

  const total = exteriorTotal + interiorTotal;
  const completed = exteriorCompleted + interiorCompleted;
  const progress = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;

  return { completed, total, progress };
}
