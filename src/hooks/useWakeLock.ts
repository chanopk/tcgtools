import { useCallback, useEffect, useRef, useState } from 'react'

/** พิมพ์เองแทนการพึ่ง lib.dom เพื่อไม่ให้ชนกับ TS เวอร์ชันที่ยังไม่มี Wake Lock */
interface WakeLockSentinelLike {
  released: boolean
  release(): Promise<void>
  addEventListener(type: 'release', listener: () => void): void
}

interface NavigatorWithWakeLock {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> }
}

function getWakeLock() {
  if (typeof navigator === 'undefined') return undefined
  return (navigator as unknown as NavigatorWithWakeLock).wakeLock
}

/**
 * กันจอดับระหว่างเล่น
 * ระบบจะปล่อย wake lock เองเวลาสลับแท็บ/ล็อกจอ จึงต้องขอใหม่ตอนกลับมา
 */
export function useWakeLock(enabled: boolean) {
  const supported = typeof navigator !== 'undefined' && getWakeLock() !== undefined
  const [active, setActive] = useState(false)
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null)

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current
    sentinelRef.current = null
    setActive(false)
    if (sentinel && !sentinel.released) {
      try {
        await sentinel.release()
      } catch {
        /* ปล่อยไม่สำเร็จก็ไม่เป็นไร */
      }
    }
  }, [])

  const acquire = useCallback(async () => {
    const wakeLock = getWakeLock()
    if (!wakeLock || sentinelRef.current) return
    try {
      const sentinel = await wakeLock.request('screen')
      sentinelRef.current = sentinel
      setActive(true)
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) sentinelRef.current = null
        setActive(false)
      })
    } catch {
      // บางเบราว์เซอร์ปฏิเสธเมื่อแบตต่ำหรือไม่ได้อยู่หน้าจอ — ข้ามไปเงียบ ๆ
      setActive(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      void release()
      return
    }

    void acquire()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void release()
    }
  }, [enabled, acquire, release])

  return { supported, active }
}
