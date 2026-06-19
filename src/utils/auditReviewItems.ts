import { Step, UserRole } from '../types';
import type { TranslateFn } from '../context/LanguageContext';
import { loadAlgemeenFromStorage, isApartmentBuildingType } from '../storage/algemeenData';
import { loadHouseDesignPageRaw, loadHouseDesignAlgemeenHints } from '../storage/houseDesignPageData';
import { buildInteriorFloorSections, getSelectedRoomsForFloor } from './interiorRoomsFromUpload';
import {
  buildPhotoCaptureCategoryList,
  isPhotoCaptureDoorCategory,
  isPhotoCaptureWindowCategory,
} from './photoCaptureRooms';
import type { PhotoCaptureStoredData } from '../storage/photoCaptureData';
import { translateUploadRoom, translateUploadFloor, translatePhotoCategory } from '../i18n/translateOptions';

export type AuditReviewItem = {
  title: string;
  description: string;
  complete: boolean;
  actionLabel: string;
  targetStep: Step;
  answeredCount: number;
  totalCount: number;
};

type InsulationSpecs = Record<string, { material: string; customMaterial?: string; thickness: string; yearBuilt?: string }>;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function buildAuditReviewItems(
  input: {
    bouwjaar: string;
    buurt: string;
    wijk: string;
    gemeente: string;
    hasFloorPlans: boolean | null;
    selectedRole: UserRole;
    vloerenType: string;
    wandenType: string;
    gboT: string;
    leidingdoorvoeren: string;
    avr: string;
    uploadedFilesCount: number;
    photoCaptureData: PhotoCaptureStoredData | null;
  },
  t: TranslateFn,
): AuditReviewItem[] {
  // 1. VERIFICATION
  const isVerificationComplete = true;

  // 2. ALGEMEEN (GENERAL)
  const algemeen = loadAlgemeenFromStorage();
  const buildingType = algemeen.buildingType ?? 'Eengezinswoning';
  const position = algemeen.position ?? 'Vrijstaand';
  const location = algemeen.location ?? 'Hellend Dak';
  const numberOfFloors = algemeen.numberOfFloors;
  const hasFloorPlans = algemeen.hasFloorPlans;
  const whichFloor = algemeen.whichFloor;
  const hasKelder = algemeen.hasKelder;
  const hasKruipruimte = algemeen.hasKruipruimte;
  const city = algemeen.city ?? '';
  const renovationStatus = algemeen.renovationStatus ?? '';
  const renovationYear = algemeen.renovationYear ?? '';
  const buurt = algemeen.buurt ?? '';
  const wijk = algemeen.wijk ?? '';
  const gemeente = algemeen.gemeente ?? '';
  const gebouwhoogte = algemeen.gebouwhoogte ?? '';
  const floorArea = algemeen.floorArea ?? '';
  const bouwjaar = algemeen.bouwjaar ?? '';

  let generalTotal = 0;
  let generalAnswered = 0;

  // Building Type
  generalTotal++;
  if (buildingType) generalAnswered++;

  // Position
  generalTotal++;
  if (position) generalAnswered++;

  // Location/Roof type
  generalTotal++;
  if (location) generalAnswered++;

  // Number of Floors
  generalTotal++;
  if (numberOfFloors !== null && numberOfFloors > 0) generalAnswered++;

  // Floor plans question
  generalTotal++;
  if (hasFloorPlans !== null) generalAnswered++;

  // Apartment "which floor"
  const isApartment = isApartmentBuildingType(buildingType);
  if (isApartment) {
    generalTotal++;
    if (whichFloor) generalAnswered++;
  }

  // Basement questions
  const showBasementQuestions = !isApartment || whichFloor === 'Begane grond';
  if (showBasementQuestions) {
    generalTotal++;
    if (hasKelder !== null) generalAnswered++;

    generalTotal++;
    if (hasKruipruimte !== null) generalAnswered++;
  }

  // Role based
  if (input.selectedRole !== UserRole.CLIENT) {
    generalTotal++;
    if (city.trim() !== '') generalAnswered++;

    generalTotal++;
    if (renovationStatus.trim() !== '') generalAnswered++;

    if (renovationStatus === 'Ja' || renovationStatus === 'Yes') {
      generalTotal++;
      if (renovationYear.trim() !== '') generalAnswered++;
    }
  }

  if (input.selectedRole === UserRole.BACK_OFFICE) {
    generalTotal++;
    if (buurt.trim() !== '') generalAnswered++;

    generalTotal++;
    if (wijk.trim() !== '') generalAnswered++;

    generalTotal++;
    if (gemeente.trim() !== '') generalAnswered++;

    generalTotal++;
    if (gebouwhoogte.trim() !== '') generalAnswered++;

    generalTotal++;
    if (floorArea.trim() !== '') generalAnswered++;

    generalTotal++;
    if (bouwjaar.trim() !== '') generalAnswered++;
  }

  const isAlgemeenComplete = generalAnswered === generalTotal;

  const generalMissing: string[] = [];
  if (!buildingType) generalMissing.push(t('algemeen.labels.buildingType'));
  if (!position) generalMissing.push(t('algemeen.labels.position'));
  if (!location) generalMissing.push(t('algemeen.labels.roofType') || t('algemeen.labels.location'));
  if (numberOfFloors === null || numberOfFloors <= 0) generalMissing.push(t('algemeen.labels.numberOfFloors'));
  if (isApartment && !whichFloor) generalMissing.push(t('algemeen.labels.startFloor'));
  if (showBasementQuestions) {
    if (hasKelder === null) generalMissing.push(t('algemeen.labels.hasBasement'));
    if (hasKruipruimte === null) generalMissing.push(t('algemeen.labels.hasCrawlSpace'));
  }
  if (hasFloorPlans === null) generalMissing.push(t('algemeen.labels.hasFloorPlans'));
  if (input.selectedRole !== UserRole.CLIENT && !city.trim()) generalMissing.push(t('algemeen.labels.city'));
  if (input.selectedRole !== UserRole.CLIENT && !renovationStatus) generalMissing.push(t('algemeen.labels.renovationStatus'));
  if (input.selectedRole !== UserRole.CLIENT && (renovationStatus === 'Ja' || renovationStatus === 'Yes') && !renovationYear.trim()) {
    generalMissing.push(t('algemeen.labels.yearRenovation'));
  }
  if (input.selectedRole === UserRole.BACK_OFFICE) {
    if (!buurt.trim()) generalMissing.push(t('algemeen.labels.neighborhood'));
    if (!wijk.trim()) generalMissing.push(t('algemeen.labels.district'));
    if (!gemeente.trim()) generalMissing.push(t('algemeen.labels.municipality'));
    if (!gebouwhoogte.trim()) generalMissing.push(t('algemeen.labels.buildingHeight'));
    if (!floorArea.trim()) generalMissing.push(t('algemeen.labels.floorArea'));
    if (!bouwjaar.trim()) generalMissing.push(t('algemeen.labels.yearBuilt'));
  }

  const algemeenDescription = isAlgemeenComplete
    ? t('finalReview.items.algemeen.descriptionComplete')
    : t('finalReview.items.algemeen.descriptionMissing', { items: generalMissing.join(', ') });



  // 3. HOUSE DESIGN (HUISONTWERP)
  const selection = loadHouseDesignPageRaw();
  const hintsDesign = loadHouseDesignAlgemeenHints();
  const floorSections = buildInteriorFloorSections(
    hintsDesign.numberOfFloors,
    hintsDesign.hasKelder,
    hintsDesign.startFloorKey,
  );

  let designTotal = 0;
  let designAnswered = 0;

  // Floor plans upload if required
  const requiresDrawings = hasFloorPlans === true || hasFloorPlans === null;
  if (requiresDrawings) {
    designTotal++;
    if (input.uploadedFilesCount > 0) designAnswered++;
  }

  // Room selection per active floor
  const designMissing: string[] = [];
  floorSections.forEach((floor) => {
    const floorSelected =
      (selection.selectedRooms?.[floor] || []).length +
      (selection.selectedCustomRooms?.[floor] || []).length;
    designTotal++;
    if (floorSelected > 0) {
      designAnswered++;
    } else {
      designMissing.push(
        t('finalReview.items.drawing.missingFloorRooms', {
          floor: translateUploadFloor(floor, t),
        }) || `${translateUploadFloor(floor, t)} rooms`
      );
    }
  });

  // Technical assessment questions (role-based)
  if (input.selectedRole !== UserRole.CLIENT) {
    designTotal++;
    if (input.vloerenType) designAnswered++;

    designTotal++;
    if (input.wandenType) designAnswered++;
  }

  if (input.selectedRole === UserRole.BACK_OFFICE) {
    designTotal++;
    if (input.gboT.trim() !== '') designAnswered++;

    designTotal++;
    if (input.leidingdoorvoeren.trim() !== '') designAnswered++;

    designTotal++;
    if (input.avr.trim() !== '') designAnswered++;
  }

  const isDrawingComplete = designAnswered === designTotal;

  if (requiresDrawings && input.uploadedFilesCount === 0) {
    designMissing.unshift(t('upload.floorPlansTitle') || 'floor plans');
  }
  if (input.selectedRole !== UserRole.CLIENT) {
    if (!input.vloerenType) designMissing.push(t('upload.labels.floorConstruction'));
    if (!input.wandenType) designMissing.push(t('upload.labels.wallConstruction'));
  }
  if (input.selectedRole === UserRole.BACK_OFFICE) {
    if (!input.gboT.trim()) designMissing.push(t('upload.labels.gboT'));
    if (!input.leidingdoorvoeren.trim()) designMissing.push(t('upload.labels.pipePenetrations'));
    if (!input.avr.trim()) designMissing.push(t('upload.labels.avr'));
  }

  const drawingDescription = isDrawingComplete
    ? (requiresDrawings
        ? t('finalReview.items.drawing.descriptionComplete', { count: input.uploadedFilesCount })
        : t('finalReview.items.drawing.descriptionNotRequired'))
    : t('finalReview.items.drawing.descriptionMissing', { items: designMissing.join(', ') });


  // 4. INSULATION (ISOLATIE)
  const insulation = readJson<{
    insulationSpecs?: InsulationSpecs;
    doorIsolated?: boolean | null;
    hasNewInsulation?: boolean | null;
    selectedCategories?: string[];
  }>('massEPA_insulation_v1');

  const isolatieStatus = insulation?.hasNewInsulation ?? null;
  const insulationSpecs = insulation?.insulationSpecs ?? {};
  const doorIsolated = insulation?.doorIsolated ?? null;

  let insulationTotal = 0;
  let insulationAnswered = 0;

  // New insulation applied?
  insulationTotal++;
  if (isolatieStatus !== null) insulationAnswered++;

  if (isolatieStatus === true) {
    // Tick at least one category
    insulationTotal++;
    const catCount = (insulation?.selectedCategories || []).length;
    if (catCount > 0) insulationAnswered++;

    // For each selected category, require material, thickness & year built (role based)
    (insulation?.selectedCategories || []).forEach((cat) => {
      const spec = insulationSpecs[cat];
      const hasMaterial =
        spec &&
        (spec.material === 'Anders'
          ? (spec.customMaterial || '').trim() !== ''
          : (spec.material || '').trim() !== '');
      const hasThickness = spec && (spec.thickness || '').trim() !== '';
      const hasYearBuilt = spec && (spec.yearBuilt || '').trim() !== '';

      if (input.selectedRole !== UserRole.CLIENT) {
        insulationTotal++;
        if (hasMaterial) insulationAnswered++;

        insulationTotal++;
        if (hasThickness) insulationAnswered++;

        insulationTotal++;
        if (hasYearBuilt) insulationAnswered++;
      }
    });
  }

  if (input.selectedRole !== UserRole.CLIENT) {
    insulationTotal++;
    if (doorIsolated !== null) insulationAnswered++;
  }

  const isConstructieComplete = insulationAnswered === insulationTotal;

  const insulationMissing: string[] = [];
  if (isolatieStatus === true) {
    if ((insulation?.selectedCategories || []).length === 0) {
      insulationMissing.push(t('insulation.selectCategory') || 'insulation category');
    } else {
      (insulation?.selectedCategories || []).forEach((cat) => {
        const spec = insulationSpecs[cat];
        const hasMaterial =
          spec &&
          (spec.material === 'Anders'
            ? (spec.customMaterial || '').trim() !== ''
            : (spec.material || '').trim() !== '');
        const hasThickness = spec && (spec.thickness || '').trim() !== '';
        const hasYearBuilt = spec && (spec.yearBuilt || '').trim() !== '';

        if (input.selectedRole !== UserRole.CLIENT) {
          if (!hasMaterial) insulationMissing.push(`${cat} material`);
          if (!hasThickness) insulationMissing.push(`${cat} thickness`);
          if (!hasYearBuilt) insulationMissing.push(`${cat} insulation year`);
        }
      });
    }
  }
  if (input.selectedRole !== UserRole.CLIENT && doorIsolated === null) {
    insulationMissing.push(t('insulation.doorIsolated') || 'door insulation status');
  }

  let constructieDescription = '';
  if (isolatieStatus === null) {
    constructieDescription = t('finalReview.items.constructie.descriptionNotSelected');
  } else if (isolatieStatus === false) {
    constructieDescription = t('finalReview.items.constructie.descriptionNoInsulation');
  } else if (isConstructieComplete) {
    constructieDescription = t('finalReview.items.constructie.descriptionComplete');
  } else {
    constructieDescription = t('finalReview.items.constructie.descriptionMissing', {
      items: insulationMissing.join(', '),
    });
  }


  // 5. INSTALLATIONS (INSTALLATIES)
  const installatie = readJson<{
    selectedSections?: string[];
    ventilationType?: 'natural' | 'mechanical' | null;
    ventilationCo2?: boolean | null;
    heatingSystemType?: string;
    heatingLocation?: string;
    otherHeatingLocation?: string;
    emissionSystemType?: string;
    controlType?: string;
    heatingSameAsWater?: boolean | null;
    tapWaterGenerator?: string;
    tapWaterDevice?: string;
    tapWaterLocation?: string;
    tapWaterCustomLocation?: string;
    solarPanels?: boolean | null;
    solarPanelCount?: string;
    solarTiltAngle?: string;
    solarIntegration?: string;
    activeCooling?: boolean | null;
    coolingRooms?: string[];
    coolingGeneratorType?: string;
    coolingEmissionSystem?: string;
  }>('massEPA_installatie_v1');

  let installatieTotal = 0;
  let installatieAnswered = 0;

  // Selected sections list (at least one ticked)
  installatieTotal++;
  const sectionsCount = (installatie?.selectedSections || []).length;
  if (sectionsCount > 0) installatieAnswered++;

  if (sectionsCount > 0) {
    const sections = installatie?.selectedSections || [];

    if (sections.includes('ventilation')) {
      installatieTotal++;
      if (installatie?.ventilationType) installatieAnswered++;

      if (installatie?.ventilationType === 'mechanical') {
        installatieTotal++;
        if (installatie?.ventilationCo2 !== null) installatieAnswered++;
      }
    }

    if (sections.includes('heating')) {
      installatieTotal++;
      if (installatie?.heatingSystemType) installatieAnswered++;

      installatieTotal++;
      if (installatie?.heatingLocation) installatieAnswered++;

      if (installatie?.heatingLocation === 'Anders') {
        installatieTotal++;
        if (installatie?.otherHeatingLocation?.trim()) installatieAnswered++;
      }

      if (input.selectedRole !== UserRole.CLIENT) {
        installatieTotal++;
        if (installatie?.emissionSystemType) installatieAnswered++;

        installatieTotal++;
        if (installatie?.controlType) installatieAnswered++;
      }
    }

    if (sections.includes('tapwater')) {
      installatieTotal++;
      if (installatie?.heatingSameAsWater !== null) installatieAnswered++;

      if (installatie?.heatingSameAsWater === false) {
        installatieTotal++;
        if (installatie?.tapWaterGenerator) installatieAnswered++;

        if (input.selectedRole !== UserRole.CLIENT) {
          installatieTotal++;
          if (installatie?.tapWaterDevice) installatieAnswered++;
        }

        installatieTotal++;
        if (installatie?.tapWaterLocation) installatieAnswered++;

        if (installatie?.tapWaterLocation === 'Anders') {
          installatieTotal++;
          if (installatie?.tapWaterCustomLocation?.trim()) installatieAnswered++;
        }
      }
    }

    if (sections.includes('solar')) {
      installatieTotal++;
      if (installatie?.solarPanels !== null) installatieAnswered++;

      if (installatie?.solarPanels === true) {
        installatieTotal++;
        if (installatie?.solarPanelCount?.trim()) installatieAnswered++;

        installatieTotal++;
        if (installatie?.solarTiltAngle?.trim()) installatieAnswered++;

        installatieTotal++;
        if (installatie?.solarIntegration) installatieAnswered++;
      }
    }

    if (sections.includes('cooling')) {
      installatieTotal++;
      if (installatie?.activeCooling !== null) installatieAnswered++;

      if (installatie?.activeCooling === true) {
        installatieTotal++;
        if ((installatie?.coolingRooms || []).length > 0) installatieAnswered++;

        if (input.selectedRole !== UserRole.CLIENT) {
          installatieTotal++;
          if (installatie?.coolingGeneratorType) installatieAnswered++;

          installatieTotal++;
          if (installatie?.coolingEmissionSystem) installatieAnswered++;
        }
      }
    }
  }

  const isInstallatieComplete = installatieAnswered === installatieTotal;

  const installatieMissing: string[] = [];
  if (sectionsCount === 0) {
    installatieMissing.push('installations selected');
  } else {
    const sections = installatie?.selectedSections || [];
    if (sections.includes('ventilation')) {
      if (!installatie?.ventilationType) installatieMissing.push(t('installatie.ventilationType') || 'ventilation type');
      if (installatie?.ventilationType === 'mechanical' && installatie?.ventilationCo2 === null) {
        installatieMissing.push(t('installatie.co2Sensor') || 'CO2 sensor');
      }
    }
    if (sections.includes('heating')) {
      if (!installatie?.heatingSystemType) installatieMissing.push(t('installatie.generatorType') || 'heating type');
      if (!installatie?.heatingLocation) installatieMissing.push(t('installatie.heatingLocation') || 'heating location');
      if (installatie?.heatingLocation === 'Anders' && !installatie?.otherHeatingLocation?.trim()) {
        installatieMissing.push('custom heating location');
      }
      if (input.selectedRole !== UserRole.CLIENT) {
        if (!installatie?.emissionSystemType) installatieMissing.push(t('installatie.emissionSystem') || 'heating emission');
        if (!installatie?.controlType) installatieMissing.push(t('installatie.controlType') || 'heating control');
      }
    }
    if (sections.includes('tapwater')) {
      if (installatie?.heatingSameAsWater === null) installatieMissing.push('same as heating?');
      if (installatie?.heatingSameAsWater === false) {
        if (!installatie?.tapWaterGenerator) installatieMissing.push('tap water generator');
        if (input.selectedRole !== UserRole.CLIENT) {
          if (!installatie?.tapWaterDevice) installatieMissing.push('tap water device');
        }
        if (!installatie?.tapWaterLocation) installatieMissing.push('tap water location');
        if (installatie?.tapWaterLocation === 'Anders' && !installatie?.tapWaterCustomLocation?.trim()) {
          installatieMissing.push('custom tap water location');
        }
      }
    }
    if (sections.includes('solar')) {
      if (installatie?.solarPanels === null) installatieMissing.push(t('installatie.solarPanels') || 'solar panels');
      if (installatie?.solarPanels === true) {
        if (!installatie?.solarPanelCount?.trim()) installatieMissing.push('solar panel count');
        if (!installatie?.solarTiltAngle?.trim()) installatieMissing.push('solar tilt angle');
        if (!installatie?.solarIntegration) installatieMissing.push('solar integration');
      }
    }
    if (sections.includes('cooling')) {
      if (installatie?.activeCooling === null) installatieMissing.push('cooling present');
      if (installatie?.activeCooling === true) {
        if ((installatie?.coolingRooms || []).length === 0) installatieMissing.push('cooling rooms');
        if (input.selectedRole !== UserRole.CLIENT) {
          if (!installatie?.coolingGeneratorType) installatieMissing.push('cooling generator type');
          if (!installatie?.coolingEmissionSystem) installatieMissing.push('cooling emission system');
        }
      }
    }
  }

  const installatieDescription = isInstallatieComplete
    ? t('finalReview.items.installatie.descriptionComplete')
    : t('finalReview.items.installatie.descriptionMissing', { items: installatieMissing.join(', ') });


  // 6. PHOTOS (FOTO'S)
  const photos = input.photoCaptureData;
  const voor = photos?.exterior?.voor?.length ?? 0;
  const achter = photos?.exterior?.achter?.length ?? 0;

  const photoMissing: string[] = [];

  let photoTotal = 0;
  let photoAnswered = 0;

  // Front facade
  photoTotal++;
  if (voor > 0) photoAnswered++;
  else {
    photoMissing.push(t('finalReview.items.photo.missingVoor') || 'front facade photo');
  }

  // Back facade
  photoTotal++;
  if (achter > 0) photoAnswered++;
  else {
    photoMissing.push(t('finalReview.items.photo.missingAchter') || 'back facade photo');
  }

  // Links facade (optional)
  const links = photos?.exterior?.links?.length ?? 0;
  if (links > 0) {
    photoTotal++;
    photoAnswered++;
  }

  // Rechts facade (optional)
  const rechts = photos?.exterior?.rechts?.length ?? 0;
  if (rechts > 0) {
    photoTotal++;
    photoAnswered++;
  }



  const selectedRoomsList: { roomId: string; name: string; floor: string }[] = [];
  floorSections.forEach((floor) => {
    const rooms = getSelectedRoomsForFloor(selection, floor);
    const uniqueRooms = [...new Set(rooms)];
    uniqueRooms.forEach((room) => {
      selectedRoomsList.push({
        roomId: `${floor}_${room}`,
        name: room,
        floor,
      });
    });
  });

  selectedRoomsList.forEach((room) => {
    const roomCategories = buildPhotoCaptureCategoryList(
      room.name,
      room.roomId,
      photos?.extraInteriorCategories || {},
      photos?.interior || {},
      photos?.interiorDetails || {},
    );

    roomCategories.forEach((category) => {
      const hasPhoto = (photos?.interior?.[room.roomId]?.[category] || []).length > 0;
      
      photoTotal++;
      if (hasPhoto) {
        photoAnswered++;

        // 2. Door details (doorIsolated)
        if (isPhotoCaptureDoorCategory(category) && input.selectedRole !== UserRole.CLIENT) {
          photoTotal++;
          const doorDetails = photos?.interiorDetails?.[room.roomId]?.[category]?.doorIsolated;
          if (doorDetails === true || doorDetails === false) photoAnswered++;
          else {
            photoMissing.push(
              t('finalReview.items.photo.missingInsulation', {
                room: translateUploadRoom(room.name, t),
                category: translatePhotoCategory(category, t),
              }) || `${translateUploadRoom(room.name, t)} - ${category} insulation`
            );
          }
        }

        // 3. Window details (glassType & frameType)
        if (isPhotoCaptureWindowCategory(category) && input.selectedRole !== UserRole.CLIENT) {
          photoTotal++;
          const glassType = photos?.interiorDetails?.[room.roomId]?.[category]?.glassType;
          if (glassType) photoAnswered++;
          else {
            photoMissing.push(
              t('finalReview.items.photo.missingGlassType', {
                room: translateUploadRoom(room.name, t),
                category: translatePhotoCategory(category, t),
              }) || `${translateUploadRoom(room.name, t)} - ${category} glass type`
            );
          }

          photoTotal++;
          const frameType = photos?.interiorDetails?.[room.roomId]?.[category]?.frameType;
          if (frameType) photoAnswered++;
          else {
            photoMissing.push(
              t('finalReview.items.photo.missingFrameType', {
                room: translateUploadRoom(room.name, t),
                category: translatePhotoCategory(category, t),
              }) || `${translateUploadRoom(room.name, t)} - ${category} frame type`
            );
          }
        }
      } else {
        // Photo itself is missing!
        photoMissing.push(
          t('finalReview.items.photo.missingPhoto', {
            room: translateUploadRoom(room.name, t),
            category: translatePhotoCategory(category, t),
          }) || `${translateUploadRoom(room.name, t)} - ${category} photo`
        );
      }
    });
  });

  const isPhotoComplete = photoAnswered === photoTotal;

  const photoDescription = isPhotoComplete
    ? t('finalReview.items.photo.descriptionComplete')
    : t('finalReview.items.photo.descriptionMissing', { items: photoMissing.slice(0, 4).join(', ') + (photoMissing.length > 4 ? ` (+${photoMissing.length - 4} more)` : '') });


  return [
    {
      title: t('finalReview.items.verification.title'),
      description: t('finalReview.items.verification.description'),
      complete: isVerificationComplete,
      actionLabel: t('finalReview.items.verification.action'),
      targetStep: Step.ALGEMEEN,
      answeredCount: 1,
      totalCount: 1,
    },
    {
      title: t('finalReview.items.algemeen.title'),
      description: algemeenDescription,
      complete: isAlgemeenComplete,
      actionLabel: t('finalReview.items.algemeen.action'),
      targetStep: Step.ALGEMEEN,
      answeredCount: generalAnswered,
      totalCount: generalTotal,
    },
    {
      title: t('finalReview.items.drawing.title'),
      description: drawingDescription,
      complete: isDrawingComplete,
      actionLabel: t('finalReview.items.drawing.action'),
      targetStep: Step.UPLOAD,
      answeredCount: designAnswered,
      totalCount: designTotal,
    },
    {
      title: t('finalReview.items.constructie.title'),
      description: constructieDescription,
      complete: isConstructieComplete,
      actionLabel: t('finalReview.items.constructie.action'),
      targetStep: Step.INSULATION_DETAILS,
      answeredCount: insulationAnswered,
      totalCount: insulationTotal,
    },
    {
      title: t('finalReview.items.installatie.title'),
      description: installatieDescription,
      complete: isInstallatieComplete,
      actionLabel: t('finalReview.items.installatie.action'),
      targetStep: Step.INSTALLATIE,
      answeredCount: installatieAnswered,
      totalCount: installatieTotal,
    },
    {
      title: t('finalReview.items.photo.title'),
      description: photoDescription,
      complete: isPhotoComplete,
      actionLabel: t('finalReview.items.photo.action'),
      targetStep: Step.PHOTO_CAPTURE,
      answeredCount: photoAnswered,
      totalCount: photoTotal,
    },
  ];
}
