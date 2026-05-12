/** Screen keys that have camera/upload instruction modals. */
export type MediaInstructionScreen = 'upload' | 'photoCapture' | 'insulation' | 'kozijn';

export type MediaInstructionVariant = 'camera' | 'upload';

/** i18n key paths (passed to `t()` in MediaInstructionModal). */
export type MediaInstructionEntry = {
  titleKey: string;
  subtitleKey: string;
  tipsKeys: string[];
  continueKey: string;
  illustrationEmoji: string;
  illustrationCaptionKey: string;
  /** Shorter tips shown in review step (Photo Capture) */
  reviewTipsKeys?: string[];
};

export const mediaInstructions: Record<
  MediaInstructionScreen,
  Partial<Record<MediaInstructionVariant, MediaInstructionEntry>>
> = {
  upload: {
    camera: {
      titleKey: 'upload.guide.camera.title',
      subtitleKey: 'upload.guide.camera.subtitle',
      tipsKeys: [
        'upload.guide.camera.tip1',
        'upload.guide.camera.tip2',
        'upload.guide.camera.tip3',
        'upload.guide.camera.tip4',
        'upload.guide.camera.tip5',
      ],
      continueKey: 'upload.guide.camera.continue',
      illustrationEmoji: '📸',
      illustrationCaptionKey: 'upload.guide.camera.illustration',
    },
    upload: {
      titleKey: 'upload.guide.upload.title',
      subtitleKey: 'upload.guide.upload.subtitle',
      tipsKeys: [
        'upload.guide.upload.tip1',
        'upload.guide.upload.tip2',
        'upload.guide.upload.tip3',
        'upload.guide.upload.tip4',
        'upload.guide.upload.tip5',
      ],
      continueKey: 'upload.guide.upload.continue',
      illustrationEmoji: '📁',
      illustrationCaptionKey: 'upload.guide.upload.illustration',
    },
  },
  photoCapture: {
    camera: {
      titleKey: 'photos.guide.camera.title',
      subtitleKey: 'photos.guide.camera.subtitle',
      tipsKeys: [
        'photos.guide.camera.tip1',
        'photos.guide.camera.tip2',
        'photos.guide.camera.tip3',
        'photos.guide.camera.tip4',
        'photos.guide.camera.tip5',
      ],
      continueKey: 'photos.guide.camera.continue',
      illustrationEmoji: '📸',
      illustrationCaptionKey: 'photos.guide.camera.illustration',
    },
  },
  insulation: {
    camera: {
      titleKey: 'insulation.guide.camera.title',
      subtitleKey: 'insulation.guide.camera.subtitle',
      tipsKeys: [
        'insulation.guide.camera.tip1',
        'insulation.guide.camera.tip2',
        'insulation.guide.camera.tip3',
        'insulation.guide.camera.tip4',
        'insulation.guide.camera.tip5',
      ],
      continueKey: 'insulation.guide.camera.continue',
      illustrationEmoji: '📸',
      illustrationCaptionKey: 'insulation.guide.camera.illustration',
    },
    upload: {
      titleKey: 'insulation.guide.upload.title',
      subtitleKey: 'insulation.guide.upload.subtitle',
      tipsKeys: [
        'insulation.guide.upload.tip1',
        'insulation.guide.upload.tip2',
        'insulation.guide.upload.tip3',
        'insulation.guide.upload.tip4',
        'insulation.guide.upload.tip5',
      ],
      continueKey: 'insulation.guide.upload.continue',
      illustrationEmoji: '📁',
      illustrationCaptionKey: 'insulation.guide.upload.illustration',
    },
  },
  kozijn: {
    camera: {
      titleKey: 'kozijn.guide.camera.title',
      subtitleKey: 'kozijn.guide.camera.subtitle',
      tipsKeys: [
        'kozijn.guide.camera.tip1',
        'kozijn.guide.camera.tip2',
        'kozijn.guide.camera.tip3',
        'kozijn.guide.camera.tip4',
        'kozijn.guide.camera.tip5',
      ],
      continueKey: 'kozijn.guide.camera.continue',
      illustrationEmoji: '📸',
      illustrationCaptionKey: 'kozijn.guide.camera.illustration',
    },
    upload: {
      titleKey: 'kozijn.guide.upload.title',
      subtitleKey: 'kozijn.guide.upload.subtitle',
      tipsKeys: [
        'kozijn.guide.upload.tip1',
        'kozijn.guide.upload.tip2',
        'kozijn.guide.upload.tip3',
        'kozijn.guide.upload.tip4',
        'kozijn.guide.upload.tip5',
      ],
      continueKey: 'kozijn.guide.upload.continue',
      illustrationEmoji: '📁',
      illustrationCaptionKey: 'kozijn.guide.upload.illustration',
    },
  },
};

export function getMediaInstruction(
  screen: MediaInstructionScreen,
  variant: MediaInstructionVariant,
): MediaInstructionEntry | null {
  return mediaInstructions[screen]?.[variant] ?? null;
}
