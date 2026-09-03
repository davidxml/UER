/**
 * Normalises a reporter's free-text location into a full, reportable address.
 * If the user already named the campus (UNILAG / University of Lagos) the text
 * is used as-is; otherwise the campus is appended so every incident carries a
 * complete location.
 */
export function formatLocation(userInput: string): string {
  const cleanInput = userInput.trim()
  const lower = cleanInput.toLowerCase()

  if (lower.includes('unilag') || lower.includes('university of lagos')) {
    return cleanInput
  }

  return `${cleanInput}, University of Lagos`
}
