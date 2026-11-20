'use client';

import React from 'react';
import { SystemSettings } from '@/types';
import { LogoSettingsCard } from './LogoSettingsCard';
import { InstitutionNamesCard } from './InstitutionNamesCard';
import { ThemeColorsCard } from './ThemeColorsCard';
import { TypographySettingsCard } from './TypographySettingsCard';
import { ContactAndSocialCard } from './ContactAndSocialCard';

export interface BrandIdentitySectionProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  savingSettings: boolean;
  setSavingSettings: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogoFileUpload: (file: File) => void;
  uploadingLogo: boolean;
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  setActionSuccess: (msg: string | null) => void;
}

export function BrandIdentitySection({
  settings,
  setSettings,
  savingSettings,
  setSavingSettings,
  handleLogoFileUpload,
  uploadingLogo,
  logoFileInputRef,
  setActionSuccess,
}: BrandIdentitySectionProps) {
  return (
    <div className="space-y-5">
      {/* 1. University Logo & Crest */}
      <LogoSettingsCard
        settings={settings}
        setSettings={setSettings}
        savingSettings={savingSettings}
        setSavingSettings={setSavingSettings}
        handleLogoFileUpload={handleLogoFileUpload}
        uploadingLogo={uploadingLogo}
        logoFileInputRef={logoFileInputRef}
        setActionSuccess={setActionSuccess}
      />

      {/* 2. University & Faculty Names */}
      <InstitutionNamesCard
        settings={settings}
        setSettings={setSettings}
      />

      {/* 3. Theme Colors & Visual Contrast Presets (WCAG AAA) */}
      <ThemeColorsCard
        settings={settings}
        setSettings={setSettings}
      />

      {/* 4. Font Size & Typography Settings */}
      <TypographySettingsCard
        settings={settings}
        setSettings={setSettings}
        savingSettings={savingSettings}
        setSavingSettings={setSavingSettings}
        setActionSuccess={setActionSuccess}
      />

      {/* 5. Contact, Announcements, Portal Footer & Social Media */}
      <ContactAndSocialCard
        settings={settings}
        setSettings={setSettings}
      />
    </div>
  );
}
