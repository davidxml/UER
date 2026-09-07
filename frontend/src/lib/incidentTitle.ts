/**
 * Derives a human-readable report title from the department the incident was
 * tagged with. Falls back to a generic title when no department (or an
 * unknown one) is set.
 */
export function incidentTitle(tagged: string): string {
  const first = tagged.split(',')[0].trim()

  switch (first) {
    case 'Medical Center':
      return 'Medical Emergency Report'
    case 'Fire Station':
      return 'Fire Incidence Report'
    case 'Alpha Base':
      return 'Security & Protocol Report'
    default:
      return 'General Incident Report'
  }
}
