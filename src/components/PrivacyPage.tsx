import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import React from 'react'
import {ShieldAlert, ArrowLeft} from 'lucide-react'
import {TRANSLATIONS} from '../data/translations'
import {DEFAULT_SITE_SETTINGS} from '../data/siteSettings'

interface PrivacyPageProps {
  currentLang: Locale
  onBack: () => void
}

/**
 * GDPR-ready Privacy Policy (draft for legal review).
 * Controllers fields: use known site contacts; EDRPOU must be filled by UAOS when available.
 */
export default function PrivacyPage({currentLang, onBack}: PrivacyPageProps) {
  const t = TRANSLATIONS[currentLang]
  const address = resolveLocalized(DEFAULT_SITE_SETTINGS.address, currentLang)
  const privacyEmail = DEFAULT_SITE_SETTINGS.email
  // TODO: replace with official EDRPOU when confirmed by UAOS
  const edrpou = currentLang === 'uk' ? 'буде уточнено' : 'to be confirmed'

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-8">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-brand-slate-500 hover:text-brand-blue-500 uppercase tracking-wider mb-2 focus:outline-none cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{currentLang === 'uk' ? 'Повернутися' : 'Back to Home'}</span>
        </button>

        <div className="space-y-3 border-b border-brand-slate-100 dark:border-brand-slate-800 pb-4">
          <div className="inline-flex items-center space-x-2 text-brand-blue-500 bg-brand-blue-50 dark:bg-brand-blue-950/40 px-3 py-1.5 rounded-full">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
              {currentLang === 'uk' ? 'ЗАХИСТ ДАНИХ · GDPR' : 'DATA PROTECTION · GDPR'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {currentLang === 'uk'
              ? 'Політика конфіденційності та обробки персональних даних'
              : 'Privacy Policy and Personal Data Processing'}
          </h1>
          <p className="text-xs font-mono text-brand-slate-400">
            {currentLang === 'uk'
              ? 'Останнє оновлення: 20 липня 2026 року'
              : 'Last updated: 20 July 2026'}
          </p>
        </div>

        <div className="glass-card p-6 sm:p-10 rounded-3xl shadow-lg space-y-8 text-sm sm:text-base text-brand-slate-700 dark:text-brand-slate-200 leading-relaxed font-sans">
          {currentLang === 'uk' ? (
            <>
              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  1. Загальні положення та Контролер даних
                </h2>
                <p>
                  Ця Політика регулює порядок збору, зберігання, використання та захисту персональних
                  даних на веб-сайті Громадської спілки «Українська Асоціація Професійної Безпеки»
                  (надалі — «UAOS», «ми»).
                </p>
                <p>
                  Ми діємо відповідно до законодавства України «Про захист персональних даних» та
                  Загального регламенту ЄС про захист даних (GDPR).
                </p>
                <p>Контролером (Володільцем) ваших персональних даних є:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Громадська спілка «Українська Асоціація Професійної Безпеки» (UAOS)</li>
                  <li>Код ЄДРПОУ: {edrpou}</li>
                  <li>Юридична адреса: {address}</li>
                  <li>
                    Електронна пошта з питань конфіденційності:{' '}
                    <a href={`mailto:${privacyEmail}`} className="text-brand-blue-500 hover:underline">
                      {privacyEmail}
                    </a>
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  2. Які персональні дані ми збираємо
                </h2>
                <p>
                  Ми збираємо лише ті дані, які ви добровільно надаєте шляхом заповнення інтерактивних
                  форм на сайті (форма «Вступити», форми зворотного зв’язку), а саме:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Прізвище, ім’я та по батькові контактної особи;</li>
                  <li>Назва організації або компанії, яку ви представляєте;</li>
                  <li>Адреса електронної пошти та контактний номер телефону;</li>
                  <li>Код ЄДРПОУ або аналогічний реєстраційний номер для нерезидентів України;</li>
                  <li>
                    Цифровий слід згоди (IP-адреса, дата та час надання згоди на обробку даних).
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  3. Мета збору та правова підстава обробки (Стаття 6 GDPR)
                </h2>
                <p>
                  Ваші дані обробляються виключно на підставі вашої явної згоди, наданої під час
                  відправлення форми. Мета використання:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Розгляд, валідація та адміністрування вашої заявки на вступ до членів UAOS;</li>
                  <li>Надання зворотного зв’язку та комунікація щодо статусу вашої заявки;</li>
                  <li>
                    Захист від спаму, шахрайства та забезпечення технічної безпеки сайту (легітимний
                    інтерес).
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  4. Залучення третіх сторін та транскордонне передавання даних
                </h2>
                <p>
                  Для забезпечення роботи сайту та безпечного зберігання інформації ми залучаємо
                  зовнішніх постачальників послуг (Обробників даних). Ваші дані можуть оброблятися та
                  зберігатися у хмарній інфраструктурі: хостинг і serverless API{' '}
                  <strong>Vercel</strong>, база даних <strong>Neon Postgres</strong> (регіон EU),
                  файлове сховище <strong>Vercel Blob</strong>, перевірка ботів{' '}
                  <strong>Cloudflare Turnstile</strong>, транзакційні сповіщення{' '}
                  <strong>Brevo</strong>, а також аналітика <strong>Vercel Analytics</strong> лише
                  після вашої згоди на cookie.
                </p>
                <p>
                  Оскільки ці сервери можуть розташовуватися за межами Європейської економічної зони
                  (ЄЕЗ) та України (включаючи США), ми гарантуємо, що передавання даних здійснюється
                  виключно з використанням належних заходів безпеки, передбачених GDPR (зокрема,
                  застосування Стандартних договірних умов — Standard Contractual Clauses). Ми ніколи
                  не продаємо ваші дані стороннім маркетинговим або рекламним агентствам.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  5. Зберігання та безпека даних
                </h2>
                <p>
                  Ми застосовуємо сучасні протоколи шифрування та обмеження доступу. Доступ до ваших
                  даних мають лише уповноважені адміністратори UAOS.
                </p>
                <p>
                  <strong>Термін зберігання:</strong> персональні дані зберігаються стільки, скільки
                  необхідно для досягнення цілей збору. Дані неуспішних кандидатів на вступ
                  видаляються не пізніше ніж через 3 (три) роки після останнього контакту. Дані
                  дійсних членів зберігаються протягом усього терміну їхнього членства в асоціації.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  6. Ваші права як суб&apos;єкта даних
                </h2>
                <p>Відповідно до GDPR ви маєте право:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Право на доступ</strong> — отримати копію ваших персональних даних;
                  </li>
                  <li>
                    <strong>Право на виправлення</strong> — вимагати оновлення неточних даних;
                  </li>
                  <li>
                    <strong>Право на видалення («право бути забутим»)</strong> — вимагати видалення
                    даних за відсутності законних підстав для зберігання;
                  </li>
                  <li>
                    <strong>Право на відкликання згоди</strong> — у будь-який момент скасувати згоду,
                    звернувшись на email з Розділу 1 (не впливає на законність обробки до відкликання);
                  </li>
                  <li>
                    <strong>Право на переносимість</strong> — отримати дані у структурованому
                    машиночитаному форматі.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  7. Використання файлів Cookie
                </h2>
                <p>
                  Для забезпечення базової працездатності сайту та захисту форм від ботів ми можемо
                  використовувати строго необхідні технічні файли cookie. Будь-які аналітичні або
                  маркетингові трекери запускаються виключно після отримання вашої явної згоди через
                  спеціальний інформаційний банер на сайті (якщо такий буде впроваджено).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  8. Зміни до цієї Політики
                </h2>
                <p>
                  Ми маємо право періодично оновлювати цю Політику конфіденційності. Суттєві зміни
                  набувають чинності після публікації на цій сторінці. Рекомендуємо регулярно
                  перевіряти дату «Останнього оновлення».
                </p>
                <p className="text-xs text-brand-slate-500 italic">
                  Цей текст є робочим драфтом для технічної відповідності GDPR. Для міжнародних
                  контрактів рекомендується фінальний аудит профільним юристом.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  1. General provisions and Data Controller
                </h2>
                <p>
                  This Policy governs the collection, storage, use, and protection of personal data on
                  the website of the Public Union “Ukrainian Association of Occupational Safety”
                  (hereinafter “UAOS”, “we”).
                </p>
                <p>
                  We act in accordance with the Ukrainian Law “On Personal Data Protection” and the EU
                  General Data Protection Regulation (GDPR).
                </p>
                <p>The Controller of your personal data is:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Public Union “Ukrainian Association of Occupational Safety” (UAOS)</li>
                  <li>EDRPOU code: {edrpou}</li>
                  <li>Legal address: {address}</li>
                  <li>
                    Privacy contact email:{' '}
                    <a href={`mailto:${privacyEmail}`} className="text-brand-blue-500 hover:underline">
                      {privacyEmail}
                    </a>
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  2. What personal data we collect
                </h2>
                <p>
                  We collect only data you voluntarily provide via interactive forms (membership join
                  form, feedback forms), namely:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Full name of the contact person;</li>
                  <li>Organisation or company name you represent;</li>
                  <li>Email address and contact phone number;</li>
                  <li>EDRPOU or equivalent registration number for non-residents of Ukraine;</li>
                  <li>Digital consent trail (IP address, date and time of consent).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  3. Purpose and legal basis (GDPR Article 6)
                </h2>
                <p>
                  Your data is processed based on your explicit consent given when submitting the form.
                  Purposes of use:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Review, validation, and administration of your UAOS membership application;</li>
                  <li>Feedback and communication regarding application status;</li>
                  <li>
                    Protection against spam/fraud and ensuring technical website security (legitimate
                    interest).
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  4. Third parties and cross-border transfers
                </h2>
                <p>
                  To operate the website and store information securely we use external service
                  providers (Processors). Your data may be processed in cloud infrastructure:{' '}
                  <strong>Vercel</strong> hosting and serverless API, <strong>Neon Postgres</strong>,{' '}
                  <strong>Vercel Blob</strong>, <strong>Cloudflare Turnstile</strong>, transactional
                  email via <strong>Brevo</strong>, and <strong>Vercel Analytics</strong> only after
                  cookie consent.
                </p>
                <p>
                  As these servers may be located outside the EEA and Ukraine (including the USA),
                  transfers are carried out with GDPR-appropriate safeguards (including Standard
                  Contractual Clauses). We never sell your data to marketing or advertising agencies.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  5. Retention and security
                </h2>
                <p>
                  We apply encryption and access controls. Only authorised UAOS administrators can
                  access your data.
                </p>
                <p>
                  <strong>Retention:</strong> personal data is kept only as long as needed for the
                  purposes collected. Data of unsuccessful membership applicants is deleted no later
                  than 3 (three) years after the last contact. Data of active members is kept for the
                  duration of membership.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  6. Your rights as a data subject
                </h2>
                <p>Under GDPR you have the right to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Access</strong> — obtain a copy of your personal data;
                  </li>
                  <li>
                    <strong>Rectification</strong> — request correction of inaccurate data;
                  </li>
                  <li>
                    <strong>Erasure (“right to be forgotten”)</strong> — request deletion where there
                    is no lawful basis to keep the data;
                  </li>
                  <li>
                    <strong>Withdraw consent</strong> — at any time via the email in Section 1
                    (without affecting lawfulness of processing before withdrawal);
                  </li>
                  <li>
                    <strong>Portability</strong> — receive your data in a structured, machine-readable
                    format.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  7. Cookies
                </h2>
                <p>
                  We may use strictly necessary technical cookies for basic site operation and
                  anti-bot protection of forms. Any analytics or marketing trackers run only after
                  your explicit consent via an information banner (if such a banner is implemented).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
                  8. Changes to this Policy
                </h2>
                <p>
                  We may update this Privacy Policy periodically. Material changes take effect after
                  publication on this page. Please check the “Last updated” date regularly.
                </p>
                <p className="text-xs text-brand-slate-500 italic">
                  This text is a working draft for technical GDPR alignment. For international
                  contracts, a final review by a qualified lawyer is recommended.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
