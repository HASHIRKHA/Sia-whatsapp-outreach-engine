/**
 * Renders a spin-syntax template into a single string.
 *
 * Spin syntax:  {option A|option B|option C}  → picks one at random
 * Nested spin:  {Hello {there|friend}|Hi {name}}  → resolved inside-out
 * Variable substitution: {name}, {city} → replaced with vars[key]
 *
 * Unknown variables are left as-is (empty string if key absent and group
 * has no pipe character). The loop terminates when no innermost {} remain.
 */
export function spinText(
  template: string,
  vars: Record<string, string> = {},
): string {
  let result = template;
  const MAX_PASSES = 50;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const prev = result;
    // Match only innermost {} groups — no nested braces inside
    result = result.replace(/\{([^{}]*)\}/g, (_match, group: string) => {
      const options = group.split('|');
      if (options.length > 1) {
        return options[Math.floor(Math.random() * options.length)] ?? '';
      }
      const key = group.trim();
      return vars[key] !== undefined ? vars[key] : '';
    });
    if (result === prev) break;
  }

  // Collapse multiple consecutive spaces left by empty variable substitutions
  return result.replace(/ {2,}/g, ' ').trim();
}

/**
 * Returns true when phone passes the E.164 format check.
 * E.164: + followed by 7–15 digits, first digit non-zero.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}
