import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {FileText, ArrowLeft, AlertTriangle, Info} from 'lucide-react'
import {DEFAULT_SITE_SETTINGS} from '../data/siteSettings'
import {TRANSLATIONS} from '../data/translations'
import {SITE_TERMS_UPDATED, SITE_TERMS_VERSION} from '../lib/siteTerms'

interface TermsPageProps {
  currentLang: Locale
  onBack: () => void
}

/**
 * Умови використання сайту та подання заявки на участь.
 * Текст позначений як шаблон і потребує схвалення UAOS / юриста перед офіційним застосуванням.
 */
export default function TermsPage({currentLang, onBack}: TermsPageProps) {
  const isUk = currentLang === 'uk'
  const address = resolveLocalized(DEFAULT_SITE_SETTINGS.address, isUk ? 'uk' : 'en')
  const email = DEFAULT_SITE_SETTINGS.email
  const t = TRANSLATIONS[currentLang]
  /** Автентичні версії документа існують лише uk/en — інші локалі бачать англійський текст. */
  const showLangNotice = currentLang !== 'uk' && currentLang !== 'en'

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-brand-slate-500 hover:text-brand-blue-500 uppercase tracking-wider mb-2 focus:outline-none cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{isUk ? 'Повернутися' : 'Back'}</span>
        </button>

        <div
          role="status"
          className="rounded-2xl border border-amber-300/80 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30 px-4 py-3 sm:px-5 sm:py-4 flex gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-1 text-sm text-amber-950 dark:text-amber-100 leading-relaxed">
            <p className="font-semibold uppercase tracking-wide text-xs font-mono">
              {isUk ? 'Шаблон · Потребує схвалення' : 'Template · Requires approval'}
            </p>
            <p>
              {isUk
                ? 'Нижче наведено робочий шаблон умов використання сайту та подання заявки на участь. Це не фінальний юридичний документ. Офіційне застосування можливе лише після перегляду та схвалення уповноваженими особами UAOS (за потреби — з участю юриста). До схвалення текст слід трактувати як орієнтир, а не як обов’язкові умови договору.'
                : 'The text below is a working template for website terms of use and membership application terms. It is not a final legal document. Official use is allowed only after review and approval by authorised UAOS persons (and legal counsel if needed). Until approved, treat this text as guidance, not as binding contractual terms.'}
            </p>
          </div>
        </div>

        {showLangNotice && (
          <div
            role="note"
            className="rounded-2xl border border-brand-slate-200 bg-brand-slate-50 dark:border-brand-slate-700 dark:bg-brand-slate-900/40 px-4 py-3 sm:px-5 flex gap-3"
          >
            <Info className="w-4 h-4 text-brand-blue-500 shrink-0 mt-0.5" aria-hidden />
            <div className="space-y-1 text-sm text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed">
              <p className="font-mono uppercase tracking-wide text-[10px] font-bold text-brand-slate-500 dark:text-brand-slate-400">
                {t.legal_lang_notice_title}
              </p>
              <p>{t.legal_lang_notice_body}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 border-b border-brand-slate-100 dark:border-brand-slate-800 pb-4">
          <div className="inline-flex items-center space-x-2 text-brand-blue-500 bg-brand-blue-50 dark:bg-brand-blue-950/40 px-3 py-1.5 rounded-full">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
              {isUk ? 'УМОВИ · ЧЕРНЕТКА' : 'TERMS · DRAFT'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {isUk
              ? 'Умови використання сайту та подання заявки на участь'
              : 'Website Terms of Use and Membership Application Terms'}
          </h1>
          <p className="text-xs font-mono text-brand-slate-400">
            {isUk
              ? `Останнє оновлення: ${SITE_TERMS_UPDATED.uk} · Версія: ${SITE_TERMS_VERSION}`
              : `Last updated: ${SITE_TERMS_UPDATED.en} · Version: ${SITE_TERMS_VERSION}`}
          </p>
        </div>

        <div className="glass-card p-6 sm:p-10 rounded-3xl shadow-lg space-y-8 text-sm sm:text-base text-brand-slate-700 dark:text-brand-slate-200 leading-relaxed font-sans">
          {isUk ? (
            <UkrainianTerms address={address} email={email} />
          ) : (
            <EnglishTerms address={address} email={email} />
          )}
        </div>
      </div>
    </article>
  )
}

function UkrainianTerms({address, email}: {address: string; email: string}) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">1. Хто ми</h2>
        <p>
          Сайт належить та адмініструється Громадською спілкою «Українська Асоціація Професійної
          Безпеки» (далі — <strong>UAOS</strong>, <strong>ми</strong>). Контакти:{' '}
          <a className="underline underline-offset-2" href={`mailto:${email}`}>
            {email}
          </a>
          ; адреса: {address}.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          2. Предмет цих Умов
        </h2>
        <p>Ці Умови регулюють:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>доступ і використання публічного сайту UAOS;</li>
          <li>подання заявки на вступ / участь через онлайн-форму;</li>
          <li>загальні очікування щодо достовірності відомостей і добросовісної поведінки заявника.</li>
        </ul>
        <p>
          Питання обробки персональних даних регулюються окремою{' '}
          <strong>Політикою конфіденційності</strong>. Ці Умови не замінюють статут, правила вступу,
          кодекс поведінки чи інші внутрішні документи асоціації, коли такі документи будуть
          офіційно затверджені та опубліковані.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          3. Використання сайту
        </h2>
        <p>Використовуючи сайт, ви погоджуєтесь:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>не порушувати законодавство України та права третіх осіб;</li>
          <li>не намагатися отримати несанкціонований доступ до систем, даних або облікових записів;</li>
          <li>не надсилати шкідливий код, спам або свідомо неправдиві відомості;</li>
          <li>не використовувати контент сайту способом, що вводить в оману щодо статусу чи зв’язку з UAOS.</li>
        </ul>
        <p>
          Матеріали сайту (тексти, логотипи, дизайн) захищені правом інтелектуальної власності.
          Дозволяється перегляд і цитування з посиланням на джерело в обсязі, передбаченому законом.
          Інше використання — лише за письмовою згодою UAOS, якщо інше не зазначено прямо.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          4. Інформаційний характер контенту
        </h2>
        <p>
          Публікації, каталог учасників, новини та документи на сайті надаються з інформаційною
          метою. Вони не є індивідуальною юридичною, технічною чи комерційною консультацією, якщо
          інше прямо не зазначено. UAOS прагне актуальності матеріалів, але не гарантує абсолютну
          повноту чи безпомилковість у кожний момент часу.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          5. Заявка на участь
        </h2>
        <p>
          Подання заявки через форму на сайті є <strong>зверненням про розгляд можливості участі</strong>
          , а не автоматичним прийняттям до членства. Рішення ухвалює UAOS відповідно до своїх
          внутрішніх процедур і критеріїв.
        </p>
        <p>Надсилаючи заявку, ви підтверджуєте, що:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>надані відомості є правдивими, актуальними та повними наскільки вам відомо;</li>
          <li>ви уповноважені подавати заявку від імені зазначеної організації (якщо дієте не особисто);</li>
          <li>ви ознайомлені з цією версією Умов і з Політикою конфіденційності;</li>
          <li>розумієте, що UAOS може запросити додаткові документи чи уточнення;</li>
          <li>розумієте, що заявка може бути прийнята, відхилена або залишена без задоволення без
            обов’язку мотивувати рішення понад те, що визначено внутрішніми правилами та законом.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          6. Очікування щодо поведінки
        </h2>
        <p>
          Заявники та учасники очікуються діяти добросовісно, дотримуватись принципів професійної
          етики та не завдавати шкоди репутації асоціації чи інших учасників. Детальні норми (зокрема
          кодекс поведінки) можуть бути викладені в окремих затверджених документах.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          7. Посилання на сторонні ресурси
        </h2>
        <p>
          Сайт може містити посилання на зовнішні вебсайти. UAOS не контролює їх зміст і не несе
          відповідальності за політику конфіденційності чи практику третіх сторін.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          8. Обмеження відповідальності
        </h2>
        <p>
          У межах, дозволених застосовним правом, UAOS не відповідає за непрямі збитки, упущену
          вигоду чи втрату даних, що виникли через використання або неможливість використання сайту,
          крім випадків умислу чи грубої необережності, якщо інше прямо не передбачено законом.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          9. Зміни Умов
        </h2>
        <p>
          Ми можемо оновлювати ці Умови. Актуальна версія публікується на цій сторінці з датою та
          номером версії. Для суттєвих змін, що стосуються згоди при поданні заявки, нова версія
          фіксується в журналі згод через оновлення <code>SITE_TERMS_VERSION</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          10. Контакти
        </h2>
        <p>
          З питань цих Умов звертайтесь: {email}. Адреса: {address}.
        </p>
      </section>
    </>
  )
}

function EnglishTerms({address, email}: {address: string; email: string}) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">1. Who we are</h2>
        <p>
          This website is operated by the Public Union “Ukrainian Association of Occupational
          Safety” (hereinafter <strong>UAOS</strong>, <strong>we</strong>). Contact:{' '}
          <a className="underline underline-offset-2" href={`mailto:${email}`}>
            {email}
          </a>
          ; address: {address}.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          2. Scope of these Terms
        </h2>
        <p>These Terms cover:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>access to and use of the public UAOS website;</li>
          <li>submission of a membership / participation application via the online form;</li>
          <li>general expectations of accuracy and good faith by applicants.</li>
        </ul>
        <p>
          Personal data processing is governed by the separate <strong>Privacy Policy</strong>.
          These Terms do not replace the statute, admission rules, code of conduct, or other
          internal association documents once those documents are formally approved and published.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          3. Website use
        </h2>
        <p>By using the site you agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>comply with applicable Ukrainian law and third-party rights;</li>
          <li>not attempt unauthorised access to systems, data, or accounts;</li>
          <li>not submit malware, spam, or knowingly false information;</li>
          <li>not use site content in a way that misrepresents affiliation with UAOS.</li>
        </ul>
        <p>
          Site materials (text, logos, design) are protected by intellectual property law. Viewing
          and fair quotation with attribution is allowed to the extent permitted by law. Any other
          use requires UAOS written consent unless expressly stated otherwise.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          4. Informational nature of content
        </h2>
        <p>
          Publications, the members catalogue, news, and documents are provided for information.
          They are not individual legal, technical, or commercial advice unless expressly stated.
          UAOS aims to keep materials current but does not warrant completeness or error-free
          content at every moment.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          5. Membership application
        </h2>
        <p>
          Submitting the online form is a <strong>request to be considered for participation</strong>
          , not automatic admission. UAOS decides according to its internal procedures and criteria.
        </p>
        <p>By submitting an application you confirm that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>the information provided is true, current, and complete to the best of your knowledge;</li>
          <li>you are authorised to apply on behalf of the named organisation (if not applying personally);</li>
          <li>you have read this version of the Terms and the Privacy Policy;</li>
          <li>you understand UAOS may request additional documents or clarifications;</li>
          <li>you understand the application may be accepted, declined, or left without satisfaction,
            without a duty to motivate beyond internal rules and applicable law.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          6. Conduct expectations
        </h2>
        <p>
          Applicants and members are expected to act in good faith, follow professional ethics, and
          not harm the reputation of the association or other members. Detailed rules (including a
          code of conduct) may be set out in separate approved documents.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          7. Third-party links
        </h2>
        <p>
          The site may link to external websites. UAOS does not control their content and is not
          responsible for third-party privacy practices.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          8. Limitation of liability
        </h2>
        <p>
          To the extent permitted by applicable law, UAOS is not liable for indirect damages, lost
          profits, or data loss arising from use or inability to use the site, except in cases of
          intent or gross negligence, unless otherwise required by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          9. Changes
        </h2>
        <p>
          We may update these Terms. The current version is always on this page with the update date
          and version number. For material consent-related changes at application time, the new
          version is recorded in the consent trail via an updated <code>SITE_TERMS_VERSION</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          10. Contact
        </h2>
        <p>
          For questions about these Terms: {email}. Address: {address}.
        </p>
      </section>
    </>
  )
}
