export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
  barColorClass: string;
  percent: number;
  suggestions: string[];
}

export function calculatePasswordStrength(pass: string): PasswordStrengthResult {
  if (!pass) {
    return {
      score: 0,
      label: '',
      colorClass: 'text-slate-400',
      barColorClass: 'bg-slate-200 dark:bg-slate-700',
      percent: 0,
      suggestions: [],
    };
  }

  let score = 0;
  const suggestions: string[] = [];

  if (pass.length >= 8) score += 1;
  else suggestions.push('Mínimo 8 caracteres');

  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  else suggestions.push('Maiúsculas e minúsculas');

  if (/[0-9]/.test(pass)) score += 1;
  else suggestions.push('Pelo menos um número');

  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  else suggestions.push('Símbolo especial (!@#$%)');

  if (score <= 1) {
    return {
      score: 1,
      label: 'Fraca',
      colorClass: 'text-rose-500 dark:text-rose-400',
      barColorClass: 'bg-rose-500',
      percent: 25,
      suggestions,
    };
  } else if (score === 2) {
    return {
      score: 2,
      label: 'Razoável',
      colorClass: 'text-amber-500 dark:text-amber-400',
      barColorClass: 'bg-amber-500',
      percent: 50,
      suggestions,
    };
  } else if (score === 3) {
    return {
      score: 3,
      label: 'Boa',
      colorClass: 'text-blue-500 dark:text-blue-400',
      barColorClass: 'bg-blue-500',
      percent: 75,
      suggestions,
    };
  } else {
    return {
      score: 4,
      label: 'Muito Forte',
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      barColorClass: 'bg-emerald-500',
      percent: 100,
      suggestions: [],
    };
  }
}
