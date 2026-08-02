import {useCallback, useEffect, useState} from 'react'

interface ContentResourceState<T> {
  data: T
  loading: boolean
  refresh: () => Promise<void>
}

/**
 * Загружает один ресурс по требованию и не тянет его для отключённых сценариев.
 */
export function useContentResource<T>(
  loader: () => Promise<T>,
  initialData: T,
  enabled: boolean
): ContentResourceState<T> {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(false)

  /**
   * Выполняет фактическую загрузку ресурса и обновляет локальное состояние.
   */
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const nextData = await loader()
      setData(nextData)
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    if (!enabled) return
    refresh()
  }, [enabled, refresh])

  return {data, loading, refresh}
}
