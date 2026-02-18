'use client'

import { useEffect } from 'react'

/**
 * Observes elements with `ls-*` animation classes and adds `is-inview`
 * when they enter the viewport. Uses IntersectionObserver for performance.
 *
 * Usage: call `useScrollReveal()` once in your page/layout component.
 */
export function useScrollReveal() {
  useEffect(() => {
    const selectors = [
      '.ls-fade-up',
      '.ls-fade-in',
      '.ls-slide-left',
      '.ls-slide-right',
      '.ls-scale-in',
      '.ls-reveal-line',
      '.ls-blur-in',
    ]

    const elements = document.querySelectorAll(selectors.join(','))
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview')
            observer.unobserve(entry.target) // only animate once
          }
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
