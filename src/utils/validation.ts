export function isValidEmail(email: string) {
  // Simple y suficiente para este milestone.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

