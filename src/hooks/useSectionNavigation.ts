import {useCallback} from 'react'

export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({behavior: 'smooth'})
  }
}

export function useSectionNavigation(onNavigateHome?: () => void, currentRoute = 'home') {
  return useCallback(
    (sectionId: string) => {
      if (currentRoute !== 'home' && onNavigateHome) {
        onNavigateHome()
        window.setTimeout(() => scrollToSection(sectionId), 120)
        return
      }
      scrollToSection(sectionId)
    },
    [currentRoute, onNavigateHome],
  )
}
