/** No display-name field exists on signup — approximates one from the
 * e-mail's local part (e.g. "allif51@gmail.com" -> "Allif"). */
export function firstNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Lojista"
  const cleaned = local.replace(/[^a-zA-ZÀ-ÿ]+$/, "") || local
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
