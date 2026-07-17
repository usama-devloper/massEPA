// src/utils/avatarIllustrations.tsx

export interface AvatarIllustration {
  id: string;
  nameEn: string;
  nameNl: string;
  svgMarkup: string;
}

export const AVATAR_ILLUSTRATIONS: AvatarIllustration[] = [
  {
    id: 'prof_male_1',
    nameEn: 'Professional Male 1',
    nameNl: 'Professioneel Man 1',
    svgMarkup: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <defs>
        <linearGradient id="bgMale1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FDEDEC"/>
          <stop offset="100%" stop-color="#FADBD8"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#bgMale1)"/>
      <rect x="46" y="62" width="8" height="12" fill="#E8A77A"/>
      <path d="M 30 85 L 70 85 Q 65 70 50 70 Q 35 70 30 85 Z" fill="#2E4053"/>
      <polygon points="45,70 55,70 50,82" fill="#FFFFFF"/>
      <polygon points="48,74 52,74 50,85" fill="#C0392B"/>
      <circle cx="50" cy="44" r="20" fill="#F5CBA7"/>
      <circle cx="43" cy="42" r="2" fill="#2C3E50"/>
      <circle cx="57" cy="42" r="2" fill="#2C3E50"/>
      <rect x="36" y="38" width="12" height="8" rx="1.5" stroke="#2C3E50" stroke-width="1.5" fill="none"/>
      <rect x="52" y="38" width="12" height="8" rx="1.5" stroke="#2C3E50" stroke-width="1.5" fill="none"/>
      <line x1="48" y1="42" x2="52" y2="42" stroke="#2C3E50" stroke-width="1.5"/>
      <path d="M 46 52 Q 50 56 54 52" stroke="#2C3E50" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 30 40 C 30 20 42 16 50 18 C 58 16 70 20 70 40 C 70 42 66 32 62 30 C 56 28 50 32 44 28 C 36 30 30 32 30 40 Z" fill="#3E2723"/>
    </svg>`
  },
  {
    id: 'prof_female_1',
    nameEn: 'Professional Female 1',
    nameNl: 'Professioneel Vrouw 1',
    svgMarkup: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <defs>
        <linearGradient id="bgFemale1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E0F2F1"/>
          <stop offset="100%" stop-color="#B2DFDB"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#bgFemale1)"/>
      <circle cx="50" cy="18" r="9" fill="#1A0F0A"/>
      <rect x="46" y="62" width="8" height="12" fill="#ECA992"/>
      <path d="M 38 74 L 62 74 Q 60 85 50 85 Q 40 85 38 74 Z" fill="#FFFFFF"/>
      <path d="M 30 85 L 70 85 L 66 70 Q 50 72 34 70 Z" fill="#00796B"/>
      <path d="M 34 70 L 46 85 M 66 70 L 54 85" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="50" cy="44" r="20" fill="#FADBD8"/>
      <circle cx="43" cy="43" r="2" fill="#1A0F0A"/>
      <circle cx="57" cy="43" r="2" fill="#1A0F0A"/>
      <path d="M 46 53 Q 50 57 54 53" stroke="#1A0F0A" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 30 42 C 30 24 70 24 70 42 C 70 26 62 25 50 28 C 38 25 30 26 30 42 Z" fill="#1A0F0A"/>
      <path d="M 30 38 Q 38 32 45 40 M 70 38 Q 62 32 55 40" stroke="#1A0F0A" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'prof_male_2',
    nameEn: 'Professional Male 2',
    nameNl: 'Professioneel Man 2',
    svgMarkup: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <defs>
        <linearGradient id="bgMale2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E8F8F5"/>
          <stop offset="100%" stop-color="#D1F2EB"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#bgMale2)"/>
      <rect x="46" y="62" width="8" height="12" fill="#ECA992"/>
      <path d="M 30 85 L 70 85 Q 65 70 50 70 Q 35 70 30 85 Z" fill="#546E7A"/>
      <polygon points="45,70 55,70 50,82" fill="#FFFFFF"/>
      <polygon points="48,74 52,74 50,85" fill="#2980B9"/>
      <circle cx="50" cy="44" r="20" fill="#FDF2E9"/>
      <circle cx="43" cy="42" r="2" fill="#2C3E50"/>
      <circle cx="57" cy="42" r="2" fill="#2C3E50"/>
      <path d="M 46 52 Q 50 56 54 52" stroke="#2C3E50" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 30 38 C 30 20 44 14 54 18 C 64 16 70 24 70 38 C 70 40 66 32 60 30 C 54 28 46 32 40 28 C 34 30 30 32 30 38 Z" fill="#D35400"/>
    </svg>`
  },
  {
    id: 'prof_female_2',
    nameEn: 'Professional Female 2',
    nameNl: 'Professioneel Vrouw 2',
    svgMarkup: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <defs>
        <linearGradient id="bgFemale2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FCF3CF"/>
          <stop offset="100%" stop-color="#F9E79F"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#bgFemale2)"/>
      <!-- Long Hair Back -->
      <path d="M 24 45 C 20 55 24 85 30 90 L 70 90 C 76 85 78 55 74 44 Z" fill="#3E2723"/>
      <rect x="46" y="62" width="8" height="12" fill="#ECA992"/>
      <path d="M 38 74 L 62 74 Q 60 85 50 85 Q 40 85 38 74 Z" fill="#2C3E50"/>
      <path d="M 30 85 L 70 85 L 66 70 Q 50 72 34 70 Z" fill="#C0392B"/>
      <circle cx="50" cy="44" r="20" fill="#FADBD8"/>
      <circle cx="43" cy="43" r="2" fill="#3E2723"/>
      <circle cx="57" cy="43" r="2" fill="#3E2723"/>
      <path d="M 46 53 Q 50 57 54 53" stroke="#3E2723" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 30 42 C 30 24 70 24 70 42 C 70 26 62 25 50 28 C 38 25 30 26 30 42 Z" fill="#3E2723"/>
      <path d="M 28 42 L 32 65 M 72 42 L 68 65" stroke="#3E2723" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'prof_male_3',
    nameEn: 'Professional Male 3',
    nameNl: 'Professioneel Man 3',
    svgMarkup: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <defs>
        <linearGradient id="bgMale3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#EAF2F8"/>
          <stop offset="100%" stop-color="#D4E6F1"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#bgMale3)"/>
      <rect x="46" y="62" width="8" height="12" fill="#D39E82"/>
      <path d="M 30 85 L 70 85 Q 65 70 50 70 Q 35 70 30 85 Z" fill="#D35400"/>
      <polygon points="45,70 55,70 50,78" fill="#F1C40F"/>
      <rect x="35" y="76" width="30" height="3" fill="#FFFFFF"/>
      <circle cx="50" cy="44" r="20" fill="#E5A988"/>
      <circle cx="43" cy="42" r="2" fill="#2C3E50"/>
      <circle cx="57" cy="42" r="2" fill="#2C3E50"/>
      <path d="M 46 52 Q 50 56 54 52" stroke="#2C3E50" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 32 38 Q 50 30 68 38 Q 66 32 50 32 Q 34 32 32 38 Z" fill="#2C3E50"/>
    </svg>`
  },
  {
    id: 'prof_female_3',
    nameEn: 'Professional Female 3',
    nameNl: 'Professioneel Vrouw 3',
    svgMarkup: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <defs>
        <linearGradient id="bgFemale3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F5EEF8"/>
          <stop offset="100%" stop-color="#EBDEF0"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#bgFemale3)"/>
      <circle cx="32" cy="40" r="7" fill="#1C2833"/>
      <circle cx="68" cy="40" r="7" fill="#1C2833"/>
      <circle cx="34" cy="48" r="6" fill="#1C2833"/>
      <circle cx="66" cy="48" r="6" fill="#1C2833"/>
      <rect x="46" y="62" width="8" height="12" fill="#ECA992"/>
      <path d="M 38 74 L 62 74 Q 60 85 50 85 Q 40 85 38 74 Z" fill="#FFFFFF"/>
      <path d="M 30 85 L 70 85 L 66 70 Q 50 72 34 70 Z" fill="#1F3A60"/>
      <circle cx="50" cy="44" r="20" fill="#FADBD8"/>
      <circle cx="42" cy="43" r="2" fill="#1C2833"/>
      <circle cx="58" cy="43" r="2" fill="#1C2833"/>
      <circle cx="42" cy="43" r="6" stroke="#1C2833" stroke-width="1.5" fill="none"/>
      <circle cx="58" cy="43" r="6" stroke="#1C2833" stroke-width="1.5" fill="none"/>
      <line x1="48" y1="43" x2="52" y2="43" stroke="#1C2833" stroke-width="1.5"/>
      <path d="M 46 53 Q 50 57 54 53" stroke="#1C2833" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="40" cy="28" r="7" fill="#1C2833"/>
      <circle cx="50" cy="26" r="8" fill="#1C2833"/>
      <circle cx="60" cy="28" r="7" fill="#1C2833"/>
    </svg>`
  }
];

export const getAvatarById = (id: string): AvatarIllustration | undefined => {
  return AVATAR_ILLUSTRATIONS.find((illustration) => illustration.id === id);
};

export const getAvatarSvgMarkup = (id: string): string | undefined => {
  return getAvatarById(id)?.svgMarkup;
};

export const isIllustrationId = (avatarVal: string): boolean => {
  return AVATAR_ILLUSTRATIONS.some((illustration) => illustration.id === avatarVal);
};
