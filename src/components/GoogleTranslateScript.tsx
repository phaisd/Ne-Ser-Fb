'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export function GoogleTranslateScript() {
  useEffect(() => {
    const initTranslate = () => {
      if (window.google?.translate?.TranslateElement) {
        try {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'th' },
            'google_translate_element'
          );
        } catch (e) {}
      }
    };

    window.googleTranslateElementInit = initTranslate;

    if (window.google?.translate?.TranslateElement && !document.querySelector('.goog-te-combo')) {
      initTranslate();
    }
  }, []);

  return (
    <>
      {/* Off-screen container so Google Translate can instantiate .goog-te-combo without rendering glitches */}
      <div
        id="google_translate_element"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          top: '-9999px',
          left: '-9999px',
          opacity: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function() {
            if (window.google && window.google.translate) {
              try {
                new window.google.translate.TranslateElement({ pageLanguage: 'th' }, 'google_translate_element');
              } catch (e) {}
            }
          };
        `}
      </Script>
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}

export default GoogleTranslateScript;
