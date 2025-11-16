export interface PasswordStrength {
  score: 0|1|2|3|4;
  label: string;
  suggestions: string[];
}

export function passwordStrength(pw: string): PasswordStrength {
  let score = 0 as 0|1|2|3|4;
  const suggestions: string[] = [];
  if (!pw) return { score, label: 'Vacía', suggestions: ['Ingresa una contraseña'] };
  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  if (length >= 8) score++;
  if (length >= 12) score++;
  if (hasLower && hasUpper) score++;
  if (hasDigit && hasSymbol) score++;
  if (!hasLower || !hasUpper) suggestions.push('Usa mayúsculas y minúsculas');
  if (!hasDigit) suggestions.push('Agrega números');
  if (!hasSymbol) suggestions.push('Agrega símbolos');
  if (length < 12) suggestions.push('Usa 12+ caracteres');
  const labels = ['Muy débil','Débil','Media','Fuerte','Muy fuerte'];
  return { score: score as 0|1|2|3|4, label: labels[score], suggestions };
}

export function isPasswordAcceptable(pw: string) {
  const st = passwordStrength(pw);
  return pw.length >= 8 && st.score >= 2; // mínimo razonable
}
