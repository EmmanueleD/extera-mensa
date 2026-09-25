/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')

function relevantRules(...selectors: string[]) {
  return selectors
    .map((selector) => {
      const start = stylesheet.indexOf(`${selector} {`)
      const end = stylesheet.indexOf('}', start) + 1
      if (start < 0 || end === 0) throw new Error(`Missing ${selector} in src/style.css`)
      return { source: stylesheet.slice(start, end), start }
    })
    .sort((left, right) => left.start - right.start)
    .map(({ source }) => source)
    .join('\n')
}

describe('CarpoolCar styles', () => {
  beforeEach(() => {
    const style = document.createElement('style')
    style.dataset.testStylesheet = 'carpool'
    style.textContent = relevantRules('.speech-bubble.carpool-seat-bubble', '.speech-bubble')
    document.head.append(style)
  })

  afterEach(() => {
    document.body.replaceChildren()
    document.querySelector('[data-test-stylesheet="carpool"]')?.remove()
  })

  it('keeps a car-seat message bubble out of the seat grid flow', () => {
    const bubble = document.createElement('p')
    bubble.className = 'speech-bubble speech-bubble--down carpool-drift carpool-seat-bubble'
    document.body.append(bubble)

    const style = getComputedStyle(bubble)
    expect(style.fontSize).toBe('13px')
    expect(style.position).toBe('absolute')
  })
})
