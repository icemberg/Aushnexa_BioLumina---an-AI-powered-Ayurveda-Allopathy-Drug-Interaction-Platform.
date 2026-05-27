import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest full-width py-24 border-t border-outline-variant z-20 relative mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="md:col-span-1 flex flex-col gap-6">
          <span className="font-headline-md text-headline-md font-bold text-on-surface">Aushnexa BioLumina</span>
          <p className="font-technical-sm text-technical-sm text-on-surface-variant max-w-xs">
            © 2026 Aushnexa BioLumina. For clinical research use only. BioLumina AI protocols are calibrated to international pharmacopeia standards. Not a substitute for professional medical advice.
          </p>
        </div>

        <div className="md:col-span-3 flex flex-wrap gap-x-12 gap-y-6 md:justify-end">
          <div className="flex flex-col gap-4">
            <span className="font-label-caps text-label-caps text-on-surface opacity-50">LEGAL & ETHICS</span>
            <a href="#" className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-emerald-light transition-colors duration-200">Molecular Data Integrity</a>
            <a href="#" className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-emerald-light transition-colors duration-200">Pharmacopeia Standards</a>
            <a href="#" className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-emerald-light transition-colors duration-200">Ethics & AI Compliance</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-label-caps text-label-caps text-on-surface opacity-50">ACCESS</span>
            <a href="#" className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-emerald-light transition-colors duration-200">Privacy Policy</a>
            <a href="#" className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-emerald-light transition-colors duration-200">Institutional Access</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
