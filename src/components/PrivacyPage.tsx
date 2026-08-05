import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {ShieldAlert, ArrowLeft} from 'lucide-react'
import {DEFAULT_SITE_SETTINGS} from '../data/siteSettings'

interface PrivacyPageProps {
  currentLang: Locale
  onBack: () => void
}

const POLICY_UPDATED_UK = '5 серпня 2026 року'
const POLICY_UPDATED_EN = '5 August 2026'
const POLICY_VERSION = '2026-08-05'

/**
 * Політика конфіденційності (робочий текст для публікації).
 * Орієнтири: GDPR Art. 13–14, ePrivacy (cookies), Закон України «Про захист персональних даних»,
 * Конвенція Ради Європи № 108. Фінальний юридичний аудит — за рішенням UAOS.
 */
export default function PrivacyPage({currentLang, onBack}: PrivacyPageProps) {
  const isUk = currentLang === 'uk'
  const address = resolveLocalized(DEFAULT_SITE_SETTINGS.address, isUk ? 'uk' : 'en')
  const privacyEmail = DEFAULT_SITE_SETTINGS.email
  const phone = DEFAULT_SITE_SETTINGS.phone
  const edrpou = isUk ? 'буде уточнено' : 'to be confirmed'

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

        <div className="space-y-3 border-b border-brand-slate-100 dark:border-brand-slate-800 pb-4">
          <div className="inline-flex items-center space-x-2 text-brand-blue-500 bg-brand-blue-50 dark:bg-brand-blue-950/40 px-3 py-1.5 rounded-full">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
              {isUk ? 'ЗАХИСТ ДАНИХ · GDPR · UA' : 'DATA PROTECTION · GDPR · UA'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
            {isUk
              ? 'Політика конфіденційності та обробки персональних даних'
              : 'Privacy Policy and Personal Data Processing'}
          </h1>
          <p className="text-xs font-mono text-brand-slate-400">
            {isUk
              ? `Останнє оновлення: ${POLICY_UPDATED_UK} · Версія: ${POLICY_VERSION}`
              : `Last updated: ${POLICY_UPDATED_EN} · Version: ${POLICY_VERSION}`}
          </p>
        </div>

        <div className="glass-card p-6 sm:p-10 rounded-3xl shadow-lg space-y-8 text-sm sm:text-base text-brand-slate-700 dark:text-brand-slate-200 leading-relaxed font-sans">
          {isUk ? <UkrainianPolicy address={address} email={privacyEmail} phone={phone} edrpou={edrpou} /> : (
            <EnglishPolicy address={address} email={privacyEmail} phone={phone} edrpou={edrpou} />
          )}
        </div>
      </div>
    </article>
  )
}

type PolicyContacts = {
  address: string
  email: string
  phone: string
  edrpou: string
}

function UkrainianPolicy({address, email, phone, edrpou}: PolicyContacts) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          1. Хто ми і кого стосується ця Політика
        </h2>
        <p>
          Ця Політика пояснює, як Громадська спілка «Українська Асоціація Професійної Безпеки»
          (далі — «UAOS», «ми», «Контролер») збирає, використовує, зберігає, передає та захищає
          персональні дані відвідувачів сайту, заявників на участь і контактних осіб організацій.
        </p>
        <p>
          Сайт орієнтований на міжнародну аудиторію (українська та англійська версії інтерфейсу;
          додаткові мови інтерфейсу можуть відображатися з англійським запасним варіантом). Тому ми
          враховуємо вимоги:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Закону України «Про захист персональних даних»;</li>
          <li>Загального регламенту ЄС про захист даних (GDPR), якщо обробка стосується осіб у ЄС/ЄЕЗ;</li>
          <li>Директиви ePrivacy (щодо cookies та подібних технологій);</li>
          <li>Конвенції Ради Європи № 108 (у межах застосовності для України).</li>
        </ul>
        <p>Володілець (Контролер) персональних даних:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Громадська спілка «Українська Асоціація Професійної Безпеки» (UAOS)</li>
          <li>Код ЄДРПОУ: {edrpou}</li>
          <li>Адреса: {address}</li>
          <li>
            Телефон:{' '}
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-brand-blue-500 hover:underline">
              {phone}
            </a>
          </li>
          <li>
            E-mail з питань конфіденційності:{' '}
            <a href={`mailto:${email}`} className="text-brand-blue-500 hover:underline">
              {email}
            </a>
          </li>
        </ul>
        <p>
          Окремого Data Protection Officer (DPO) на момент публікації цієї версії не призначено. З
          усіх питань захисту даних звертайтеся на вказану адресу електронної пошти.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          2. Які дані ми обробляємо і звідки вони беруться
        </h2>
        <p>Ми обробляємо лише дані, потрібні для роботи сайту та розгляду заявок.</p>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.1. Дані з форми вступу / зворотного зв’язку
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>ПІБ контактної особи;</li>
          <li>назва організації / компанії;</li>
          <li>e-mail і телефон;</li>
          <li>сайт організації (за наявності);</li>
          <li>сфера діяльності, тип заявника, галузі, категорії продукції, компетенції (якщо вказано);</li>
          <li>код ЄДРПОУ або аналог для нерезидентів (за наявності);</li>
          <li>текст повідомлення / коментаря;</li>
          <li>
            цифровий слід згоди: IP-адреса, User-Agent, мова повідомлення, версія політики, дата й
            час згоди, джерело форми.
          </li>
        </ul>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.2. Технічні та безпекові дані
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>дані для захисту від ботів і зловживань (зокрема результат Cloudflare Turnstile);</li>
          <li>технічні журнали серверних запитів у межах хостингу (обмежений обсяг, для безпеки);</li>
          <li>лічильники обмеження частоти запитів (rate limit) за технічними ключами.</li>
        </ul>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.3. Cookies, localStorage та аналітика
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>збережений вибір мови та теми оформлення сайту;</li>
          <li>збережений вибір щодо cookies / аналітики;</li>
          <li>
            аналітичні дані Vercel Analytics — лише після вашої явної згоди в банері cookies;
          </li>
          <li>
            сесійні cookies адміністраторів (лише для авторизованого доступу до адмінки, не для
            публічних відвідувачів).
          </li>
        </ul>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.4. Публічні профілі учасників
        </h3>
        <p>
          Після модерації на сайті можуть публікуватися узгоджені публічні дані організацій-учасників
          (назва, опис, логотип, публічні контакти тощо). Це окремий набір даних від сирих заявок.
        </p>

        <p>
          Ми <strong>не збираємо</strong> паспортні дані, платіжні реквізити карток і спеціальні
          категорії даних (здоров’я, біометрія, політичні погляди тощо) через цей сайт.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          3. Мета обробки та правові підстави
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200 dark:border-brand-slate-700">
                <th className="py-2 pr-3 font-semibold">Мета</th>
                <th className="py-2 pr-3 font-semibold">Підстава</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Розгляд заявки на участь, зворотний зв’язок</td>
                <td className="py-2 pr-3">Згода (GDPR Art. 6(1)(a); згода за законом України)</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Фіксація згоди (consent trail) і доказ її надання</td>
                <td className="py-2 pr-3">Згода; законний інтерес / правовий обов’язок доказовості</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Захист від ботів, спаму, зловживань, безпека сервісу</td>
                <td className="py-2 pr-3">Законний інтерес (GDPR Art. 6(1)(f))</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Необхідні cookies / збереження мови й теми</td>
                <td className="py-2 pr-3">Необхідність для запитуваної послуги сайту; ePrivacy</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Аналітика відвідуваності</td>
                <td className="py-2 pr-3">Згода (ePrivacy + GDPR Art. 6(1)(a))</td>
              </tr>
              <tr>
                <td className="py-2 pr-3">Публікація узгодженого профілю учасника</td>
                <td className="py-2 pr-3">Згода / договірні відносини членства після прийняття</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Законний інтерес щодо безпеки: запобігання шахрайству, захист інфраструктури та інших
          користувачів. Ви можете заперечити проти обробки на цій підставі (див. розділ 8), окрім
          випадків, коли ми маємо переважні законні підстави.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          4. Чи обов’язково надавати дані
        </h2>
        <p>
          Поля форми вступу, позначені як обов’язкові, потрібні для розгляду заявки. Без них ми не
          зможемо прийняти та опрацювати звернення. Аналітичні cookies не обов’язкові: сайт працює
          і при виборі «лише необхідні».
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          5. Кому ми передаємо дані (обробники та одержувачі)
        </h2>
        <p>
          Ми не продаємо персональні дані. Дані можуть оброблятися залученими постачальниками
          (процесорами) виключно для цілей цієї Політики:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Vercel</strong> — хостинг сайту та serverless API;
          </li>
          <li>
            <strong>Neon</strong> — база даних PostgreSQL (орієнтир: регіон ЄС);
          </li>
          <li>
            <strong>Vercel Blob</strong> — файлове сховище (медіа / службові файли);
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> — захист форм від ботів;
          </li>
          <li>
            <strong>Brevo</strong> — транзакційні сповіщення про нові заявки (мінімізований вміст);
          </li>
          <li>
            <strong>Vercel Analytics</strong> — аналітика лише після згоди на cookies.
          </li>
        </ul>
        <p>
          Доступ до заявок мають лише уповноважені адміністратори UAOS з обліковими записами в
          закритій адмінці (з контролем ролей і, для ролей з доступом до персональних даних, MFA).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          6. Міжнародна передача даних
        </h2>
        <p>
          Оскільки частина інфраструктури може розташовуватися за межами України та/або ЄЕЗ
          (зокрема в США), передача здійснюється з урахуванням механізмів GDPR: рішення про
          адекватність (де застосовно), Standard Contractual Clauses (SCC) та/або інші гарантії
          постачальників. Копію інформації про застосовні гарантії можна запросити електронною
          поштою з розділу 1.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          7. Строки зберігання
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Заявки в статусі «прийнято» / «відхилено»:</strong> можуть бути видалені після
            завершення розгляду; адміністратори можуть очищати закриті заявки. Рекомендований
            орієнтир внутрішньої політики — не довше, ніж потрібно для цілей розгляду та пов’язаних
            претензій (орієнтир до 3 років після останнього контакту, якщо інше не вимагає закон).
          </li>
          <li>
            <strong>Заявки «в очікуванні» / «опрацьовано»:</strong> до завершення розгляду або
            рішення.
          </li>
          <li>
            <strong>Записи згод (consents):</strong> протягом строку, необхідного для доведення
            законності обробки.
          </li>
          <li>
            <strong>Дані дійсних членів / публічні профілі:</strong> на період членства та публікації
            профілю.
          </li>
          <li>
            <strong>Вибір cookies у браузері:</strong> до зміни/очищення вами або до оновлення
            політики, що потребує нової згоди.
          </li>
          <li>
            <strong>Технічні rate-limit / журнали безпеки:</strong> короткий технічний строк.
          </li>
        </ul>
        <p>
          Точні внутрішні строки зберігання можуть бути уточнені юристом / власником даних UAOS без
          погіршення ваших прав.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          8. Ваші права
        </h2>
        <p>Залежно від застосовного права (зокрема GDPR) ви можете мати право:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>доступ</strong> — отримати підтвердження обробки та копію даних;
          </li>
          <li>
            <strong>виправлення</strong> — виправити неточні дані;
          </li>
          <li>
            <strong>видалення</strong> («право бути забутим») — за умов, передбачених законом;
          </li>
          <li>
            <strong>обмеження обробки</strong>;
          </li>
          <li>
            <strong>переносимість</strong> — отримати дані у структурованому машиночитаному форматі
            (де застосовно);
          </li>
          <li>
            <strong>заперечення</strong> — проти обробки на підставі законного інтересу;
          </li>
          <li>
            <strong>відкликання згоди</strong> — у будь-який час (не впливає на законність обробки
            до відкликання); відкликання має бути таким же простим, як надання згоди;
          </li>
          <li>
            <strong>скаргу до наглядового органу</strong> — в Україні: Уповноважений Верховної Ради
            України з прав людини; якщо ви в ЄС/ЄЕЗ — також до органу захисту даних країни вашого
            проживання або місця ймовірного порушення.
          </li>
        </ul>
        <p>
          Щоб реалізувати права, напишіть на{' '}
          <a href={`mailto:${email}`} className="text-brand-blue-500 hover:underline">
            {email}
          </a>{' '}
          з темою «Privacy request». Ми можемо попросити підтвердити особу в розумних межах. На
          запит відповідаємо без зайвої затримки (орієнтир GDPR — до 1 місяця).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          9. Cookies та подібні технології
        </h2>
        <p>
          Відповідно до ePrivacy, зберігання/читання інформації на вашому пристрої потребує згоди,
          крім строго необхідних технологій для роботи запитуваної послуги сайту.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Необхідні:</strong> робота сайту, захист форм, збереження мови (`uaos_lang`),
            теми (`uaos_theme`), вибору cookies (`uaos_cookie_consent`), сесія адмінки (лише для
            співробітників).
          </li>
          <li>
            <strong>Аналітичні:</strong> Vercel Analytics — тільки після кнопки «Прийняти» в банері.
            Вибір «Лише необхідні» не запускає аналітику.
          </li>
        </ul>
        <p>
          Маркетингові / рекламні трекери третіх сторін наразі не використовуються. Ви можете
          очистити збережені дані в налаштуваннях браузера.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          10. Безпека
        </h2>
        <p>Ми застосовуємо організаційні та технічні заходи, зокрема:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>передача даних сайтом через HTTPS;</li>
          <li>збереження заявок у окремій базі, недоступній публічно;</li>
          <li>серверна валідація форм, антибот, обмеження частоти запитів;</li>
          <li>рольовий доступ до адмінки; MFA для ролей з доступом до персональних даних;</li>
          <li>мінімізація даних у листах-сповіщеннях;</li>
          <li>журналювання окремих адміністративних дій (аудит).</li>
        </ul>
        <p>
          Жоден спосіб передачі чи зберігання в інтернеті не гарантує абсолютну безпеку. У разі
          інциденту, що створює високий ризик для ваших прав, ми вживемо передбачених законом
          заходів повідомлення.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          11. Діти
        </h2>
        <p>
          Сайт і форма вступу не призначені для осіб молодше 16 років (або вищого віку цифрової
          згоди у вашій країні ЄС). Ми свідомо не збираємо дані дітей. Якщо ви вважаєте, що дитина
          надала нам дані, напишіть на e-mail з розділу 1 — ми видалимо їх.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          12. Автоматизовані рішення
        </h2>
        <p>
          Ми не приймаємо рішень, що мають правові або подібні істотні наслідки для вас,
          виключно на основі автоматизованої обробки (профілювання з юридичними наслідками
          відсутнє). Статус заявки змінює уповноважена людина.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          13. Зміни Політики
        </h2>
        <p>
          Ми можемо оновлювати цю Політику. Актуальна версія завжди на цій сторінці з датою
          оновлення та номером версії. Якщо зміни суттєві і стосуються обробки на підставі згоди,
          ми можемо попросити нову згоду (зокрема через оновлення `PRIVACY_POLICY_VERSION` у
          системі згод).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          14. Контакти
        </h2>
        <p>
          Питання щодо цієї Політики та запити суб’єктів даних:{' '}
          <a href={`mailto:${email}`} className="text-brand-blue-500 hover:underline">
            {email}
          </a>
          .
        </p>
        <p className="text-xs text-brand-slate-500 italic">
          Цей текст підготовлено як робочу політику для публічного сайту UAOS з урахуванням
          міжнародних вимог (GDPR / ePrivacy) та законодавства України. Він не замінює індивідуальну
          юридичну консультацію; для фінального затвердження рекомендується перевірка юристом
          асоціації (зокрема код ЄДРПОУ, внутрішні строки зберігання та реєстр обробок).
        </p>
      </section>
    </>
  )
}

function EnglishPolicy({address, email, phone, edrpou}: PolicyContacts) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          1. Who we are and who this Policy covers
        </h2>
        <p>
          This Policy explains how the Public Union “Ukrainian Association of Occupational Safety”
          (“UAOS”, “we”, “Controller”) collects, uses, stores, shares and protects personal data of
          website visitors, membership applicants and organisational contact persons.
        </p>
        <p>
          The website serves an international audience (Ukrainian and English UI; additional UI
          languages may fall back to English). We therefore consider:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>the Law of Ukraine “On Personal Data Protection”;</li>
          <li>the EU GDPR where processing relates to individuals in the EU/EEA;</li>
          <li>the ePrivacy Directive (cookies and similar technologies);</li>
          <li>Council of Europe Convention 108, as applicable in Ukraine.</li>
        </ul>
        <p>Data Controller:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Public Union “Ukrainian Association of Occupational Safety” (UAOS)</li>
          <li>EDRPOU code: {edrpou}</li>
          <li>Address: {address}</li>
          <li>
            Phone:{' '}
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-brand-blue-500 hover:underline">
              {phone}
            </a>
          </li>
          <li>
            Privacy e-mail:{' '}
            <a href={`mailto:${email}`} className="text-brand-blue-500 hover:underline">
              {email}
            </a>
          </li>
        </ul>
        <p>
          No separate Data Protection Officer (DPO) is appointed for this version. Please use the
          privacy e-mail above for all data-protection matters.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          2. What data we process and where it comes from
        </h2>
        <p>We process only data needed to run the website and review applications.</p>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.1. Membership / contact form data
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>contact person’s full name;</li>
          <li>organisation / company name;</li>
          <li>e-mail and phone;</li>
          <li>organisation website (if provided);</li>
          <li>activity field, applicant type, sectors, product categories, competencies (if provided);</li>
          <li>EDRPOU or equivalent registration ID for non-residents (if provided);</li>
          <li>free-text message;</li>
          <li>
            consent trail: IP address, User-Agent, notice language, policy version, consent
            timestamp, form source.
          </li>
        </ul>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.2. Security and technical data
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>anti-bot signals (including Cloudflare Turnstile results);</li>
          <li>limited hosting/request logs for security;</li>
          <li>rate-limit counters keyed by technical identifiers.</li>
        </ul>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.3. Cookies, localStorage and analytics
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>saved language and theme preferences;</li>
          <li>saved cookie / analytics choice;</li>
          <li>Vercel Analytics data — only after explicit cookie consent;</li>
          <li>admin session cookies (authorised staff only, not public visitors).</li>
        </ul>

        <h3 className="font-display font-semibold text-brand-slate-900 dark:text-white">
          2.4. Public member profiles
        </h3>
        <p>
          After moderation, agreed public organisation data may be published (name, description,
          logo, public contacts, etc.). This is separate from raw application records.
        </p>
        <p>
          We do <strong>not</strong> collect passport scans, card payment details or special-category
          data (health, biometrics, political opinions, etc.) via this website.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          3. Purposes and legal bases
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200 dark:border-brand-slate-700">
                <th className="py-2 pr-3 font-semibold">Purpose</th>
                <th className="py-2 pr-3 font-semibold">Legal basis</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Review membership applications and reply</td>
                <td className="py-2 pr-3">Consent (GDPR Art. 6(1)(a); consent under Ukrainian law)</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Record and evidence consent</td>
                <td className="py-2 pr-3">Consent; legitimate interest / accountability</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Anti-bot, anti-abuse and service security</td>
                <td className="py-2 pr-3">Legitimate interests (GDPR Art. 6(1)(f))</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Strictly necessary cookies / language & theme</td>
                <td className="py-2 pr-3">Necessary for the requested service; ePrivacy</td>
              </tr>
              <tr className="border-b border-brand-slate-100 dark:border-brand-slate-800">
                <td className="py-2 pr-3">Audience analytics</td>
                <td className="py-2 pr-3">Consent (ePrivacy + GDPR Art. 6(1)(a))</td>
              </tr>
              <tr>
                <td className="py-2 pr-3">Publish an agreed member profile</td>
                <td className="py-2 pr-3">Consent / membership arrangements after acceptance</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Legitimate interest for security: preventing fraud and protecting infrastructure and other
          users. You may object (Section 8), unless compelling legitimate grounds apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          4. Is providing data obligatory?
        </h2>
        <p>
          Mandatory join-form fields are required to review your application; without them we cannot
          process it. Analytics cookies are optional — the site works if you choose “Necessary only”.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          5. Recipients and processors
        </h2>
        <p>We do not sell personal data. Processors may handle data only for this Policy’s purposes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Vercel</strong> — hosting and serverless API;
          </li>
          <li>
            <strong>Neon</strong> — PostgreSQL database (EU region preferred);
          </li>
          <li>
            <strong>Vercel Blob</strong> — file storage;
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> — bot protection;
          </li>
          <li>
            <strong>Brevo</strong> — transactional application alerts (minimised content);
          </li>
          <li>
            <strong>Vercel Analytics</strong> — only after cookie consent.
          </li>
        </ul>
        <p>
          Application data is accessible only to authorised UAOS administrators (role-based access;
          MFA for roles with personal-data access).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          6. International transfers
        </h2>
        <p>
          Some infrastructure may be located outside Ukraine and/or the EEA (including the USA).
          Transfers rely on GDPR mechanisms such as adequacy decisions (where applicable), Standard
          Contractual Clauses (SCCs) and/or vendor safeguards. You may request information about
          applicable safeguards via the e-mail in Section 1.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          7. Retention
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Accepted / rejected applications:</strong> may be deleted after review;
            administrators can purge closed applications. Internal guideline: keep no longer than
            needed for review and related claims (indicatively up to 3 years after last contact,
            unless law requires otherwise).
          </li>
          <li>
            <strong>Pending / reviewed applications:</strong> until a decision is made.
          </li>
          <li>
            <strong>Consent records:</strong> as long as needed to demonstrate lawful processing.
          </li>
          <li>
            <strong>Active members / public profiles:</strong> for the membership / publication
            period.
          </li>
          <li>
            <strong>Cookie choice in the browser:</strong> until you change/clear it or a material
            policy update requires new consent.
          </li>
          <li>
            <strong>Rate-limit / security logs:</strong> short technical retention.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          8. Your rights
        </h2>
        <p>Depending on applicable law (including GDPR), you may have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>access</strong> — confirmation and a copy of your data;
          </li>
          <li>
            <strong>rectification</strong>;
          </li>
          <li>
            <strong>erasure</strong> (“right to be forgotten”), where legal conditions apply;
          </li>
          <li>
            <strong>restriction</strong> of processing;
          </li>
          <li>
            <strong>portability</strong>, where applicable;
          </li>
          <li>
            <strong>object</strong> to processing based on legitimate interests;
          </li>
          <li>
            <strong>withdraw consent</strong> at any time (without affecting prior lawful
            processing); withdrawal must be as easy as giving consent;
          </li>
          <li>
            <strong>lodge a complaint</strong> with a supervisory authority — in Ukraine: the
            Ukrainian Parliament Commissioner for Human Rights; if you are in the EU/EEA, also with
            your local data-protection authority.
          </li>
        </ul>
        <p>
          To exercise rights, e-mail{' '}
          <a href={`mailto:${email}`} className="text-brand-blue-500 hover:underline">
            {email}
          </a>{' '}
          with subject “Privacy request”. We may request reasonable identity verification. We aim to
          respond without undue delay (GDPR guideline: within one month).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          9. Cookies and similar technologies
        </h2>
        <p>
          Under ePrivacy, storing or accessing information on your device requires consent, except
          for technologies strictly necessary to provide a service you requested.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Necessary:</strong> site operation, form protection, language (`uaos_lang`),
            theme (`uaos_theme`), cookie choice (`uaos_cookie_consent`), admin session (staff only).
          </li>
          <li>
            <strong>Analytics:</strong> Vercel Analytics only after “Accept” in the banner.
            “Necessary only” does not enable analytics.
          </li>
        </ul>
        <p>
          No third-party marketing trackers are used at present. You may clear stored preferences in
          your browser settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          10. Security
        </h2>
        <p>Measures include, among others:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>HTTPS transport;</li>
          <li>applications stored in a non-public database;</li>
          <li>server-side validation, anti-bot checks and rate limiting;</li>
          <li>role-based admin access with MFA for PII roles;</li>
          <li>minimised content in notification e-mails;</li>
          <li>audit logging of selected admin actions.</li>
        </ul>
        <p>
          No internet transmission or storage method is perfectly secure. If a breach poses a high
          risk to your rights, we will take legally required notification steps.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          11. Children
        </h2>
        <p>
          The site and join form are not directed to persons under 16 (or a higher digital-consent
          age in your EU country). We do not knowingly collect children’s data. If you believe a
          child provided data, contact us — we will delete it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          12. Automated decision-making
        </h2>
        <p>
          We do not make decisions with legal or similarly significant effects based solely on
          automated processing. Application status is changed by an authorised person.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          13. Changes
        </h2>
        <p>
          We may update this Policy. The current version is always on this page with the update date
          and version number. For material consent-based changes we may request fresh consent
          (including via an updated `PRIVACY_POLICY_VERSION` in consent records).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-brand-slate-900 dark:text-white">
          14. Contact
        </h2>
        <p>
          Questions and data-subject requests:{' '}
          <a href={`mailto:${email}`} className="text-brand-blue-500 hover:underline">
            {email}
          </a>
          .
        </p>
        <p className="text-xs text-brand-slate-500 italic">
          This text is a working public Privacy Policy for the UAOS website aligned with GDPR /
          ePrivacy and Ukrainian law. It is not a substitute for legal advice; final approval by the
          association’s counsel is recommended (including EDRPOU, retention schedules and a
          processing register).
        </p>
      </section>
    </>
  )
}
