import { AdmissionPortalConfig, DepartmentBannerColorTheme } from '@/types';

export type CustomizerSection =
  | 'VISIBILITY'
  | 'BANNERS'
  | 'SECTION1'
  | 'SECTION2'
  | 'SECTION3'
  | 'SECTION4';

export type SelectOptionKey =
  | 'degreeOptions'
  | 'majorOptions'
  | 'studyPlanOptions'
  | 'previousEducationOptions'
  | 'applicantTypeOptions'
  | 'nationalityTypeOptions'
  | 'programLanguageOptions';

export type EditModalState =
  | {
      type: 'banner';
      id: string;
      majorName: string;
      degreeLevel: string;
      tagline: string;
      highlightsText: string;
      colorTheme: DepartmentBannerColorTheme;
      bgImageUrl?: string;
      bgImageOpacity?: number;
      badgeText: string;
      actionText: string;
      enabled: boolean;
    }
  | {
      type: 'qualification';
      id: string;
      badgeText: string;
      themeColor: 'orange' | 'sky' | 'purple' | 'emerald';
      itemsText: string;
      enabled: boolean;
    }
  | {
      type: 'document';
      id: string;
      title: string;
      description: string;
      enabled: boolean;
    }
  | {
      type: 'selectOption';
      key: SelectOptionKey;
      categoryTitle: string;
      id: string;
      label: string;
      value: string;
      enabled: boolean;
    }
  | {
      type: 'course';
      degreeKey: 'bachelor' | 'master' | 'doctoral' | 'certificate';
      degreeTitle: string;
      id: string;
      code: string;
      nameTh: string;
      courseType: string;
      credits: number;
      enabled: boolean;
    }
  | null;
