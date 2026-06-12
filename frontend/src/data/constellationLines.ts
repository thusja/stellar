// 별자리 연결선 정의 (starPairs: 연결할 별 ID 쌍 배열)
export interface ConstellationLineData {
  name: string;
  nameKo: string;
  starPairs: [number, number][];
}

export const CONSTELLATION_LINES: ConstellationLineData[] = [
  {
    name: 'Orion',
    nameKo: '오리온자리',
    starPairs: [
      [8, 25],   // Betelgeuse - Bellatrix (어깨)
      [8, 27],   // Betelgeuse - Alnilam (오른쪽 어깨→허리)
      [25, 45],  // Bellatrix - Mintaka (왼쪽 어깨→허리)
      [45, 27],  // Mintaka - Alnilam (허리띠)
      [27, 29],  // Alnilam - Alnitak (허리띠)
      [6, 45],   // Rigel - Mintaka (왼발→허리)
      [44, 29],  // Saiph - Alnitak (오른발→허리)
    ],
  },
  {
    name: 'Ursa Major',
    nameKo: '큰곰자리 (북두칠성)',
    starPairs: [
      [30, 51],  // Dubhe - Merak (국자 오른면)
      [51, 52],  // Merak - Phecda (국자 바닥)
      [52, 53],  // Phecda - Megrez (국자 왼면)
      [53, 30],  // Megrez - Dubhe (국자 윗면)
      [53, 28],  // Megrez - Alioth (손잡이 시작)
      [28, 54],  // Alioth - Mizar (손잡이)
      [54, 32],  // Mizar - Alkaid (손잡이 끝)
    ],
  },
  {
    name: 'Cassiopeia',
    nameKo: '카시오페이아자리',
    starPairs: [
      [56, 55],  // Caph - Schedar
      [55, 57],  // Schedar - Cih
      [57, 58],  // Cih - Ruchbah
    ],
  },
  {
    name: 'Leo',
    nameKo: '사자자리',
    starPairs: [
      [60, 20],  // Algieba - Regulus
      [20, 59],  // Regulus - Denebola
    ],
  },
  {
    name: 'Scorpius',
    nameKo: '전갈자리',
    starPairs: [
      [64, 63],  // Graffias - Dschubba
      [63, 14],  // Dschubba - Antares (머리→심장)
      [14, 46],  // Antares - Sargas (꼬리)
      [46, 24],  // Sargas - Shaula (꼬리 끝)
    ],
  },
  {
    name: 'Cygnus',
    nameKo: '백조자리 (북십자)',
    starPairs: [
      [18, 61],  // Deneb - Sadr (세로축)
      [61, 62],  // Sadr - Gienah (가로축 한쪽)
    ],
  },
  {
    name: 'Crux',
    nameKo: '남십자자리',
    starPairs: [
      [23, 11],  // Gacrux - Acrux (세로축)
      [19, 65],  // Mimosa - Delta Crucis (가로축)
    ],
  },
];
