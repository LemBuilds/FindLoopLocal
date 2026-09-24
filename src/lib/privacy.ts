const PII_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /07\d{9}/, label: "phone number" },
  { pattern: /\+44\d{10}/, label: "phone number" },
  { pattern: /\S+@\S+\.\S+/, label: "email address" },
  { pattern: /[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}/i, label: "postcode" },
];

export interface PiiDetectionResult {
  hasPii: boolean;
  labels: string[];
}

export function detectPii(text: string): PiiDetectionResult {
  const labels: string[] = [];

  for (const { pattern, label } of PII_PATTERNS) {
    if (pattern.test(text) && !labels.includes(label)) {
      labels.push(label);
    }
  }

  return { hasPii: labels.length > 0, labels };
}

export function blurCoordinates(
  lat: number,
  lng: number,
  radiusKm = 0.5
): { lat: number; lng: number } {
  const latDeg = radiusKm / 111;
  const lngDeg = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.random() * 0.7 + 0.3; // between 30–100% of radius

  return {
    lat: lat + r * latDeg * Math.sin(angle),
    lng: lng + r * lngDeg * Math.cos(angle),
  };
}
