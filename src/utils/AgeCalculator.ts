/**
 * AgeCalculator - Calculate and format live-updating age
 * Calculates time since May 11, 1999, 10:00 AM to 10 decimal places
 */

// Birth date: May 11, 1999, 10:00 AM (assuming local time)
const BIRTH_DATE = new Date(1999, 4, 11, 3, 10, 0, 0); // Month is 0-indexed

/**
 * Calculate age in years with high precision
 */
export function calculateAge(): number {
  const now = Date.now();
  const birthTime = BIRTH_DATE.getTime();
  const ageInMs = now - birthTime;
  
  // Convert to years (accounting for leap years approximately)
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  return ageInMs / msPerYear;
}

/**
 * Format age to specified decimal places
 */
export function formatAge(decimalPlaces: number = 10): string {
  const age = calculateAge();
  return age.toFixed(decimalPlaces);
}

/**
 * Get age components (years, months, days, etc.)
 */
export interface AgeComponents {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export function getAgeComponents(): AgeComponents {
  const now = new Date();
  const birth = BIRTH_DATE;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  let hours = now.getHours() - birth.getHours();
  let minutes = now.getMinutes() - birth.getMinutes();
  let seconds = now.getSeconds() - birth.getSeconds();
  let milliseconds = now.getMilliseconds() - birth.getMilliseconds();

  // Adjust for negative values
  if (milliseconds < 0) {
    milliseconds += 1000;
    seconds--;
  }
  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    // Get days in previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days, hours, minutes, seconds, milliseconds };
}

/**
 * Format age components as readable string
 */
export function formatAgeReadable(): string {
  const c = getAgeComponents();
  return `${c.years}y ${c.months}m ${c.days}d ${c.hours}h ${c.minutes}m ${c.seconds}s`;
}

/**
 * Create a live-updating age element
 */
export function createLiveAgeElement(decimalPlaces: number = 10): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'live-age';
  span.style.fontFamily = 'monospace';
  
  const update = (): void => {
    span.textContent = formatAge(decimalPlaces);
  };

  // Update frequently for smooth animation
  update();
  const interval = setInterval(update, 50); // 20fps updates

  // Store interval for cleanup
  (span as HTMLSpanElement & { _ageInterval?: number })._ageInterval = interval;

  return span;
}

/**
 * Stop live age updates
 */
export function stopLiveAgeElement(span: HTMLSpanElement): void {
  const interval = (span as HTMLSpanElement & { _ageInterval?: number })._ageInterval;
  if (interval) {
    clearInterval(interval);
  }
}



