import {useCallback, useEffect, useState} from 'react'

interface ContentResourceState<T> {
  data: T
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Загружает один ресурс по требованию и не тянет его для отключённых сценариев.
 */
export function useContentResource<T>(
  loader: () => Promise<T>,
  initialData: T,
  enabled: boolean,
): ContentResourceState<T> {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextData = await loader()
      setData(nextData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, refresh])

  return {data, loading, error, refresh}
}
