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
    style.textContent = relevantRules(
      '.participant-avatar-control__initial',
      '.participant-avatar-control__name',
      '.speech-bubble.carpool-seat-bubble',
      '.speech-bubble',
      '.speech-bubble::after',
      '.carpool-steering-wheel',
      '.carpool-car__seat-grid',
      '.carpool-occupied-seat > .participant-avatar-control',
    )
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

  it('anchors a larger steering wheel opposite the participant initial', () => {
    const seat = document.createElement('div')
    const wheel = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const initial = document.createElement('span')
    wheel.classList.add('carpool-steering-wheel')
    initial.className = 'participant-avatar-control__initial'
    seat.append(wheel, initial)
    document.body.append(seat)

    const wheelStyle = getComputedStyle(wheel)
    const initialStyle = getComputedStyle(initial)
    expect(wheelStyle.position).toBe('absolute')
    expect(wheelStyle.left).toBe('1.6px')
    expect(wheelStyle.bottom).toBe('1.6px')
    expect(wheelStyle.width).toBe('20px')
    expect(wheelStyle.height).toBe('20px')
    expect(wheelStyle.pointerEvents).toBe('none')
    expect(initialStyle.right).toBe('-2.4px')
    expect(initialStyle.bottom).toBe('-3.2px')
  })

  it('gives occupied mobile seats a non-overlapping 44px control target', () => {
    const seat = document.createElement('div')
    const control = document.createElement('button')
    seat.className = 'carpool-occupied-seat'
    control.className = 'participant-avatar-control'
    seat.append(control)
    document.body.append(seat)

    const style = getComputedStyle(control)
    expect(style.width).toBe('44px')
    expect(style.height).toBe('44px')
    // Car seats have 40px columns and a 6px gap, leaving 2px between adjacent targets.
    expect(Number.parseFloat(style.width)).toBeLessThan(40 + 6)
  })

  it('bounds touch-visible names to two lines within the reserved row gap', () => {
    const grid = document.createElement('div')
    const name = document.createElement('span')
    grid.className = 'carpool-car__seat-grid'
    name.className = 'participant-avatar-control__name'
    document.body.append(grid, name)

    const gridStyle = getComputedStyle(grid)
    const nameStyle = getComputedStyle(name)
    expect(nameStyle.maxHeight).toBe('26.88px')
    expect(nameStyle.overflow).toBe('hidden')
    expect(nameStyle.getPropertyValue('-webkit-line-clamp')).toBe('2')
    expect(gridStyle.rowGap).toBe('44px')
  })

  it('removes only the elevated lane connector and retains the normal bubble tail', () => {
    expect(stylesheet).not.toContain('.carpool-seat-bubble--lane-1::before')
    expect(stylesheet).toContain('.speech-bubble::after {')
    expect(stylesheet).toContain('.speech-bubble--down::after {')
  })

  it('defines semantic narrow-screen layouts without hiding horizontal overflow', () => {
    expect(relevantRules('body')).toContain('min-width: 20rem')
    expect(stylesheet).toContain('@media (max-width: 40rem)')
    for (const selector of [
      '.app-topbar__nav',
      '.auth-page,',
      '.participant-summary__cars,',
      '.speech-bubble.carpool-seat-bubble',
      '.profile-drawer__panel',
      '.message-editor__panel',
      '.statistics-range',
      '.statistics-chart',
    ]) {
      expect(stylesheet).toContain(selector)
    }
    expect(stylesheet).toContain('min-height: 2.75rem')
    expect(stylesheet).not.toMatch(/overflow-x:\s*hidden/)
  })
})
