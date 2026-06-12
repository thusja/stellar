// RA(시간)/Dec(도) → 3D 구면 좌표 변환
// 천구의 중심(원점)에서 밖을 바라보는 관찰자 기준
export function raDec3D(
  raHours: number,
  decDegrees: number,
  radius: number = 5,
): { x: number; y: number; z: number } {
  const ra = (raHours / 24) * 2 * Math.PI;
  const dec = (decDegrees / 180) * Math.PI;
  return {
    x: radius * Math.cos(dec) * Math.cos(ra),
    y: radius * Math.sin(dec),
    z: -radius * Math.cos(dec) * Math.sin(ra), // 음수: RA가 왼쪽→오른쪽으로 증가
  };
}

// 표면 온도(K) → RGB 색상 [0~1]
export function tempToColor(temp: number): [number, number, number] {
  if (temp < 3500)  return [1.0, 0.45, 0.20]; // 적색 거성 (M형)
  if (temp < 5000)  return [1.0, 0.70, 0.35]; // 주황 (K형)
  if (temp < 6000)  return [1.0, 0.90, 0.65]; // 황백 (G형)
  if (temp < 7500)  return [1.0, 1.00, 0.95]; // 백색 (F형)
  if (temp < 10000) return [0.90, 0.95, 1.0];  // 청백 (A형)
  if (temp < 20000) return [0.75, 0.85, 1.0];  // 청색 (B형)
  return [0.60, 0.70, 1.0];                    // 진청 (O형)
}

// 등급 → 포인트 크기 (밝을수록 크게)
export function magnitudeToSize(magnitude: number): number {
  return Math.max(2, 10 - magnitude * 2);
}

// RA/Dec + 관측자 위치 + 날짜 → 고도(altitude, 도) / 방위각(azimuth, 도)
export function calcAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lngDeg: number,
  date: Date,
): { altitude: number; azimuth: number } {
  const DEG = Math.PI / 180;

  // 그리니치 항성시(GMST) 계산
  const J2000 = 2451545.0;
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - J2000) / 36525;
  const gmst = (280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T) % 360;

  // 지방 항성시(LST) → 시각(Hour Angle)
  const lst = ((gmst + lngDeg) % 360 + 360) % 360;
  const ha = ((lst - raHours * 15) % 360 + 360) % 360; // 도 단위

  const haRad = ha * DEG;
  const decRad = decDeg * DEG;
  const latRad = latDeg * DEG;

  // 고도 계산
  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG;

  // 방위각 계산
  const cosAz =
    (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(altitude * DEG));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) / DEG;
  if (Math.sin(haRad) > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth };
}

// 태양 고도 계산 (일출/일몰용 근사값)
export function calcSunAltitude(latDeg: number, lngDeg: number, date: Date): number {
  const DEG = Math.PI / 180;
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  const lambda = L + 1.915 * Math.sin(g * DEG) + 0.02 * Math.sin(2 * g * DEG);
  const eps = 23.439 - 0.0000004 * n;
  const sinDec = Math.sin(eps * DEG) * Math.sin(lambda * DEG);
  const dec = Math.asin(sinDec) / DEG;
  const ra = Math.atan2(Math.cos(eps * DEG) * Math.sin(lambda * DEG), Math.cos(lambda * DEG)) / DEG / 15;

  return calcAltAz(ra, dec, latDeg, lngDeg, date).altitude;
}

// 일출/일몰 시각 계산 (이진 탐색)
export function calcSunriseSunset(
  latDeg: number,
  lngDeg: number,
  date: Date,
): { sunrise: Date | null; sunset: Date | null } {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  const findCrossing = (startH: number, endH: number, rising: boolean): Date | null => {
    let lo = startH * 3600000;
    let hi = endH * 3600000;
    const target = -0.833; // 대기굴절 보정 기준 고도
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const t = new Date(base.getTime() + mid);
      const alt = calcSunAltitude(latDeg, lngDeg, t);
      if (rising ? alt < target : alt > target) lo = mid;
      else hi = mid;
    }
    const result = new Date(base.getTime() + (lo + hi) / 2);
    const alt = calcSunAltitude(latDeg, lngDeg, result);
    return Math.abs(alt - target) < 1 ? result : null;
  };

  return {
    sunrise: findCrossing(0, 14, true),
    sunset: findCrossing(10, 24, false),
  };
}
