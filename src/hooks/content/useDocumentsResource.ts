import {fetchDocuments, INITIAL_DOCUMENTS} from '../../data/documents'
import {useContentResource} from './useContentResource'

/**
 * Загружает документы только для сценариев, где раздел материалов показывается пользователю.
 */
export function useDocumentsResource(enabled: boolean) {
  return useContentResource(fetchDocuments, INITIAL_DOCUMENTS, enabled)
}
