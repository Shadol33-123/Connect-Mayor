export function cleanRUT(value: string) {
  return (value || '').toUpperCase().replace(/[^0-9K]/g, '');
}

export function formatRUT(value: string) {
  const clean = cleanRUT(value);
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  // Limitar a máximo 8 dígitos de cuerpo (total 9 con DV)
  const trimmedBody = body.slice(0, 8);
  const withDots = trimmedBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
}

export function validateRUT(value: string) {
  const clean = cleanRUT(value);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  // Largo del cuerpo debe ser 7 u 8 (total 8 o 9 incluyendo DV)
  if (!(body.length === 7 || body.length === 8)) return false;
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const dvCalc = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === dvCalc;
}

export function rutLengthValid(value: string) {
  const clean = cleanRUT(value);
  const body = clean.slice(0, -1);
  return body.length === 7 || body.length === 8;
}
