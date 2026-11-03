import { useEffect, useRef, useState } from 'react'

// URLs are view resources, never project/history data. Restored Files get fresh URLs.
export function useObjectUrls(files: readonly File[]) {
  const owned = useRef(new Map<File, string>())
  const [urls, setUrls] = useState<Map<File, string>>(() => new Map())
  useEffect(() => {
    const live = new Set(files)
    let changed = false
    for (const [file, url] of owned.current) {
      if (!live.has(file)) { URL.revokeObjectURL(url); owned.current.delete(file); changed = true }
    }
    for (const file of files) {
      if (!owned.current.has(file)) { owned.current.set(file, URL.createObjectURL(file)); changed = true }
    }
    if (changed) setUrls(new Map(owned.current))
  }, [files])
  useEffect(() => {
    const current = owned.current
    return () => { current.forEach(url => URL.revokeObjectURL(url)); current.clear() }
  }, [])
  return urls
}
