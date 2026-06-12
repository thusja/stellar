export interface StarPoint {
  id: number;
  name: string;
  nameKo: string;
  constellation: string;
  constellationKo: string;
  magnitude: number;
  distanceLy: number;
  temperature: number;
  ra: number;  // 적경 (시간 단위)
  dec: number; // 적위 (도 단위)
  x: number;   // 계산된 3D 좌표
  y: number;
  z: number;
}

export interface ConstellationLine {
  id: string;
  name: string;
  nameKo: string;
  starIds: [number, number][]; // 연결할 별 id 쌍 배열
}

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  label: string;
}
