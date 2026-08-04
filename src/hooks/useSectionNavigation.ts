/**
 * Плавний скрол до секції за id (наприклад, /activity#representation).
 * Раніше тут також жив хук useSectionNavigation для anchor-скролу в межах головної;
 * після переходу на path-based роутинг (Фаза 1) усі колишні споживачі перейшли на
 * реальні маршрути через onNavigate, тож хук став незастосовним і був видалений.
 */
export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({behavior: 'smooth'})
  }
}
