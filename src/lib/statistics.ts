/** Attendance statistics domain helpers. Mirrors the database statistics contract. */

export const STATISTICS_RANGES = {
  DAYS_7: '7',
  DAYS_30: '30',
  DAYS_90: '90',
  ALL: 'all',
} as const

export type StatisticsRange = (typeof STATISTICS_RANGES)[keyof typeof STATISTICS_RANGES]

export const DEFAULT_STATISTICS_RANGE: StatisticsRange = STATISTICS_RANGES.DAYS_30

export const STATISTICS_RANGE_OPTIONS: ReadonlyArray<{
  value: StatisticsRange
  label: string
  accessibleLabel: string
}> = [
  { value: STATISTICS_RANGES.DAYS_7, label: '7g', accessibleLabel: 'Ultimi 7 giorni' },
  { value: STATISTICS_RANGES.DAYS_30, label: '30g', accessibleLabel: 'Ultimi 30 giorni' },
  { value: STATISTICS_RANGES.DAYS_90, label: '90g', accessibleLabel: 'Ultimi 90 giorni' },
  { value: STATISTICS_RANGES.ALL, label: 'Tutto', accessibleLabel: 'Tutta la storia' },
]

export interface StatisticsParticipant {
  id: string
  display_name: string
  message: string | null
  avatar_seed: string
  avatar_color: string
  message_text_color: string
}

export interface StatisticsPoint {
  service_date: string
  attending_count: number
  participants: StatisticsParticipant[]
}

export interface StatisticsRankRow {
  id: string
  display_name: string
  avatar_seed: string
  avatar_color: string
  attendance_count: number
}

export interface StatisticsResult {
  range: StatisticsRange
  range_start: string
  range_end: string
  points: StatisticsPoint[]
  ranking: StatisticsRankRow[]
}

export const STATISTICS_ERRORS = {
  LOAD: 'Non è stato possibile caricare le statistiche.',
  CONNECTION: 'Connessione non disponibile. Riprova.',
} as const

const SERVICE_DATE_FORMATTER = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Europe/Rome',
})

/** Formats a Rome service date for presentation, degrading to the raw value if unparseable. */
export function formatServiceDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : SERVICE_DATE_FORMATTER.format(date)
}

export function toChartLabels(points: StatisticsPoint[]): string[] {
  return points.map((point) => formatServiceDate(point.service_date))
}

export function toChartData(points: StatisticsPoint[]): number[] {
  return points.map((point) => point.attending_count)
}

export function totalAttendance(points: StatisticsPoint[]): number {
  return points.reduce((total, point) => total + point.attending_count, 0)
}
