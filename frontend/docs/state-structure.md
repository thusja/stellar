# Stellar — Zustand 전역 상태 구조

---

## 판단 기준

> **"여러 화면/컴포넌트가 동시에 읽거나, 한 곳에서 바꾸면 다른 곳도 바뀌어야 하는 데이터"** → 전역
> **"해당 컴포넌트 안에서만 쓰이고 밖에서 알 필요 없는 데이터"** → 로컬

---

## 전역 상태 (Zustand) — 3개 스토어

---

### 1. `useObserverStore` — 관측 조건

```ts
interface ObserverStore {
  // 상태
  latitude: number; // 관측자 위도
  longitude: number; // 관측자 경도
  locationLabel: string; // "서울" | "현재 위치" 등 표시용
  isDefaultLocation: boolean; // GPS 거부 시 true
  observationDate: Date; // 현재 선택된 날짜·시각

  // 액션
  setLocation: (lat: number, lng: number, label: string) => void;
  setDefaultLocation: () => void;
  setObservationDate: (date: Date) => void;
}
```

**전역이어야 하는 이유:**

- `StarMapCanvas` (렌더링), `DateTimeSlider` (날짜 변경), `Settings` (위치 변경) 세 컴포넌트가 모두 이 값을 읽고 씁니다
- 날짜를 바꾸면 천문 계산이 다시 트리거되어야 하므로 반드시 공유 상태

---

### 2. `useStarStore` — 별 데이터 & 계산 결과

```ts
interface StarStore {
  // 상태
  stars: StarPoint[]; // 계산된 3D 좌표 포함 전체 별 배열
  constellationLines: Line[]; // 별자리 선 연결 정보
  isCalculating: boolean; // 천문 계산 진행 중 여부
  magnitudeFilter: number; // 표시할 최대 등급 (기본 4.0)
  showConstellationLines: boolean;

  // 액션
  calculateStars: (lat: number, lng: number, date: Date) => void;
  setMagnitudeFilter: (mag: number) => void;
  toggleConstellationLines: () => void;
}

interface StarPoint {
  id: number;
  name: string;
  nameKo: string;
  constellation: string;
  magnitude: number;
  distanceLy: number;
  temperature: number;
  ra: number; // 적경
  dec: number; // 적위
  x: number; // 계산된 3D 좌표
  y: number;
  z: number;
}
```

**전역이어야 하는 이유:**

- 천문 계산(9,096개 별 좌표 변환)은 비용이 크므로 한 번만 계산하고 공유
- `StarMapCanvas`(렌더링), `SearchBar`(검색), `StarDetailSheet`(조회) 모두 같은 배열을 참조
- `isCalculating`은 로딩 UI를 위해 여러 컴포넌트에서 필요

---

### 3. `useUIStore` — UI 상호작용 상태

```ts
interface UIStore {
  // 상태
  selectedStarId: number | null; // 탭된 별 ID
  isDetailSheetOpen: boolean;
  isDateSliderExpanded: boolean;
  isSettingsOpen: boolean;

  // 액션
  selectStar: (id: number | null) => void;
  openDetailSheet: () => void;
  closeDetailSheet: () => void;
  toggleDateSlider: () => void;
}
```

**전역이어야 하는 이유:**

- `selectedStarId`는 `StarMapCanvas`(하이라이트)와 `StarDetailSheet`(표시 내용) 양쪽에서 동시에 참조
- Bottom Sheet 열림 상태에 따라 3D 캔버스의 터치 이벤트 처리 방식이 달라짐

---

## 로컬 상태로 두는 것들

| 데이터                                          | 위치                          | 이유                                                              |
| ----------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Three.js `scene`, `camera`, `renderer` 인스턴스 | `StarMapCanvas` 내부 `useRef` | 렌더링 엔진 내부 객체, React 상태로 관리하면 불필요한 리렌더 발생 |
| `OrbitControls` 카메라 각도                     | `StarMapCanvas` 내부 `useRef` | 매 프레임 변경, 전역으로 두면 성능 저하                           |
| 검색창 입력 텍스트                              | `SearchBar` 로컬 `useState`   | 타이핑 중간 상태, 확정 전까지 외부에 알릴 필요 없음               |
| Bottom Sheet 드래그 위치(y값)                   | `StarDetailSheet` 로컬        | 애니메이션 내부값, 외부 관심사 아님                               |
| 권한 요청 진행 중 여부                          | `PermissionScreen` 로컬       | 해당 화면에서만 필요                                              |

---

## 스토어 간 의존 관계

```
ObserverStore
  latitude / longitude / observationDate 변경
          │
          ▼
    StarStore.calculateStars() 호출
          │
          ▼
    stars[] 갱신 → StarMapCanvas 리렌더링

UIStore
  selectedStarId 변경
          │
          ├─→ StarMapCanvas: 해당 별 하이라이트
          └─→ StarDetailSheet: 상세 데이터 표시
              (stars[selectedStarId] 조회)
```

---

## 핵심 원칙 요약

- **계산 결과는 전역** — 비용 큰 연산은 한 번만
- **렌더링 엔진 객체는 ref** — React 생명주기 밖에서 관리
- **UI 연결점은 전역** — 두 컴포넌트 이상이 같은 값을 보는 순간 전역으로 올림
- **입력 중간값은 로컬** — 확정(submit/탭)되기 전까지는 밖에 노출 불필요
