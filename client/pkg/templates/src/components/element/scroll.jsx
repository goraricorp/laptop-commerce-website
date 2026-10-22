/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'

export function AutoScroll({ children, speed = 1, pauseOnHover = true }) {
  const viewportRef = useRef(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return undefined
    let frame
    const step = () => {
      const node = viewportRef.current
      if (node) node.scrollLeft = node.scrollLeft >= node.scrollWidth - node.clientWidth ? 0 : node.scrollLeft + speed
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [paused, speed])

  return <div ref={viewportRef} className="overflow-hidden" onMouseEnter={() => pauseOnHover && setPaused(true)} onMouseLeave={() => setPaused(false)}>{children}</div>
}
