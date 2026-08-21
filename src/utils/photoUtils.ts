import { InspectionData } from '../pages/backoffice/backofficeTypes';

export interface PhotoInfo {
  dataUrl: string;
  source: string;
}

export const getAllPropertyPhotos = (data: InspectionData, extraImages?: Record<string, string>): PhotoInfo[] => {
  const photoMap = new Map<string, PhotoInfo>();

  const addPhoto = (dataUrl: string | undefined | null, source: string) => {
    if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      if (!photoMap.has(dataUrl)) {
        photoMap.set(dataUrl, { dataUrl, source });
      }
    }
  };

  // 1. From algemeen
  if (data.algemeen?.woning?.photos) {
    data.algemeen.woning.photos.forEach(p => addPhoto(p, 'Woning'));
  }
  if (data.algemeen?.bewoner?.photos) {
    data.algemeen.bewoner.photos.forEach(p => addPhoto(p, 'Bewoner'));
  }

  // 2. From installations
  if (data.installations) {
    const inst = data.installations as Record<string, any>;
    Object.keys(inst).forEach(key => {
      if (key.startsWith('files_') && Array.isArray(inst[key])) {
        const category = key.replace('files_', '');
        inst[key].forEach((file: any) => {
          if (file.type?.startsWith('image/')) {
            addPhoto(file.dataUrl, `Installatie (${category})`);
          }
        });
      }
    });
  }

  // 3. From bouwkundigRows
  if (Array.isArray(data.bouwkundigRows)) {
    data.bouwkundigRows.forEach(row => {
      if (Array.isArray(row.photos)) {
        row.photos.forEach((p: string) => addPhoto(p, row.naam || 'Bouwkundig'));
      }
      if (row.photoUrl) addPhoto(row.photoUrl, row.naam || 'Bouwkundig');
    });
  }

  // 4. From kozijnenLibrary & kozijnen
  if (Array.isArray(data.kozijnenLibrary)) {
    data.kozijnenLibrary.forEach(k => {
      if (Array.isArray(k.photos)) {
        k.photos.forEach((p: string) => addPhoto(p, k.naam || 'Kozijn Library'));
      }
      if (k.photoUrl) addPhoto(k.photoUrl, k.naam || 'Kozijn Library');
    });
  }
  if (Array.isArray(data.kozijnen)) {
    data.kozijnen.forEach(k => {
      if (Array.isArray(k.photos)) {
        k.photos.forEach((p: string) => addPhoto(p, k.naam || 'Kozijn'));
      }
      if (k.photoUrl) addPhoto(k.photoUrl, k.naam || 'Kozijn');
    });
  }

  // 5. From extraImages (like the local `images` state in InvoersheetView)
  if (extraImages) {
    Object.keys(extraImages).forEach(key => {
      addPhoto(extraImages[key], 'Overig');
    });
  }

  // 6. From constructies
  if (Array.isArray(data.constructies)) {
    data.constructies.forEach(row => {
      if (Array.isArray(row.photos)) {
        row.photos.forEach((p: string) => addPhoto(p, row.naam || 'Constructie'));
      }
      if (row.photoUrl) addPhoto(row.photoUrl, row.naam || 'Constructie');
    });
  }

  return Array.from(photoMap.values());
};
