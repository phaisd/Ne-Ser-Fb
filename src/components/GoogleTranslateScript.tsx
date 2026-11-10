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
    // Ensure googleTranslateElementInit is defined on window
    const initTranslate = () => {
      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'th',
              includedLanguages: 'en,th,my,vi,km,zh-CN,ja,lo,si,fr',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        } catch (e) {
          // Ignore re-init errors
        }
      }
    };

    window.googleTranslateElementInit = initTranslate;

    // If script was already loaded and combo is missing, trigger init manually
    if (window.google?.translate && !document.querySelector('.goog-te-combo')) {
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
                new window.google.translate.TranslateElement({
                  pageLanguage: 'th',
                  includedLanguages: 'en,th,my,vi,km,zh-CN,ja,lo,si,fr',
                  autoDisplay: false,
                }, 'google_translate_element');
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
