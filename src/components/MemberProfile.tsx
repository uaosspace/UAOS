import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { AssociationMember } from '../types';
import ProfileHero from './member-profile/ProfileHero';
import ProfileExtendedContent from './member-profile/ProfileExtendedContent';
import ProfileLegalSection from './member-profile/ProfileLegalSection';
import ProfileContactCard from './member-profile/ProfileContactCard';

interface MemberProfileProps {
  currentLang: Locale;
  member: AssociationMember;
  onBack: () => void;
}

export default function MemberProfile({ currentLang, member, onBack }: MemberProfileProps) {
  const [legalOpen, setLegalOpen] = useState(false);
  const t = TRANSLATIONS[currentLang];

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-brand-slate-500 hover:text-brand-blue-500 uppercase tracking-wider mb-8 focus:outline-none cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t.profile_back}</span>
        </button>

        <ProfileHero currentLang={currentLang} member={member} />

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Main column */}
          <div className="lg:col-span-8 space-y-8 text-left">
            
            {/* Full description */}
            <div className="space-y-4">
              <h2 className="text-xl font-display font-bold text-brand-slate-900 dark:text-white border-b border-brand-slate-100 dark:border-brand-slate-800 pb-2">
                {currentLang === 'uk' ? 'Про компанію' : 'Company Overview'}
              </h2>
              <p className="text-sm sm:text-base text-brand-slate-700 dark:text-brand-slate-300 leading-relaxed font-sans">
                {resolveLocalized(member.fullDescription, currentLang)}
              </p>
            </div>

            <ProfileExtendedContent currentLang={currentLang} member={member} />

            <ProfileLegalSection
              currentLang={currentLang}
              member={member}
              legalOpen={legalOpen}
              onToggle={() => setLegalOpen(!legalOpen)}
            />

          </div>

          {/* Right Sidebar Contacts column */}
          <div className="lg:col-span-4 space-y-6">
            
            <ProfileContactCard currentLang={currentLang} member={member} />

          </div>

        </div>

      </div>
    </article>
  );
}
