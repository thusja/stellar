import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, PixelRatio, useWindowDimensions } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

import { tempToColor } from '../../utils/starUtils';
import { useUIStore } from '../../stores/uiStore';
import { useStarStore } from '../../stores/starStore';
import { useObserverStore } from '../../stores/observerStore';
import { StarPoint } from '../../types';

// expo-three 없이 Three.js WebGLRenderer를 expo-gl에 직접 연결
function createRenderer(gl: ExpoWebGLRenderingContext): THREE.WebGLRenderer {
  const pr = PixelRatio.get();
  const width = gl.drawingBufferWidth / pr;
  const height = gl.drawingBufferHeight / pr;

  // three.js 생성자 내부에서 WebGL 버전 감지 전에 경고가 발생하므로
  // 생성자 호출 구간만 해당 메시지를 필터링 후 복원
  const _warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('WebGL 1 support was deprecated')) return;
    _warn(...args);
  };

  const renderer = new THREE.WebGLRenderer({
    canvas: {
      width,
      height,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      clientHeight: height,
      clientWidth: width,
    } as unknown as HTMLCanvasElement,
    context: gl as unknown as WebGL2RenderingContext,
    antialias: false,
  });

  // expo-gl은 내부적으로 WebGL2를 지원하므로 capabilities를 강제 지정하여 경고 제거
  (renderer.capabilities as { isWebGL2: boolean }).isWebGL2 = true;

  // console.warn 복원
  console.warn = _warn;

  renderer.setPixelRatio(pr);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x040812, 1);
  return renderer;
}

export default function StarMapCanvas() {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const selectStar = useUIStore((s) => s.selectStar);
  const focusStarId = useUIStore((s) => s.focusStarId);
  const setFocusStarId = useUIStore((s) => s.setFocusStarId);
  const isNorthLocked = useUIStore((s) => s.isNorthLocked);
  const highlightedConstellation = useUIStore((s) => s.highlightedConstellation);
  const calculateStars = useStarStore((s) => s.calculateStars);
  const calculationDebounceMs = useStarStore((s) => s.calculationDebounceMs);
  const stars = useStarStore((s) => s.stars);
  const constellationLines = useStarStore((s) => s.constellationLines);
  const showBelowHorizonLines = useStarStore((s) => s.showBelowHorizonLines);
  const magnitudeFilter = useStarStore((s) => s.magnitudeFilter);
  const showConstellationLines = useStarStore((s) => s.showConstellationLines);
  const observationDate = useObserverStore((s) => s.observationDate);
  const latitude = useObserverStore((s) => s.latitude);
  const longitude = useObserverStore((s) => s.longitude);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const starPointsMeshRef = useRef<THREE.Points | null>(null);
  const lineSegmentsRef = useRef<THREE.LineSegments | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const calcTimerRef = useRef<number | null>(null);
  const firstCalcRef = useRef(true);
  const starsRef = useRef<StarPoint[]>([]);

  // 씬 회전 상태 (React state 대신 ref → 매 프레임 변경에도 리렌더 없음)
  const rotation = useRef({ x: -0.3, y: 0.0 });
  const baseYRef = useRef(0);
  const manualYawRef = useRef(0);
  const focusAnimRef = useRef<number | null>(null);
  const gestureAnimRef = useRef<number | null>(null);
  const lastGS = useRef({ dx: 0, dy: 0, time: 0 });
  const lastTapRef = useRef({ x: 0, y: 0, time: 0 });
  const pinchDistanceRef = useRef<number | null>(null);

  // handleTap을 ref로 관리 → PanResponder 생성 시점과 무관하게 최신 클로저 사용
  const handleTapRef = useRef<(x: number, y: number) => void>(() => {});
  const handleDoubleTapRef = useRef<(x: number, y: number) => void>(() => {});

  // 최신 handleTap을 항상 ref에 유지
  handleTapRef.current = (tapX: number, tapY: number) => {
    const camera = cameraRef.current;
    const starsPoints = starPointsMeshRef.current;
    if (!camera || !starsPoints) return;

    const ndcX = (tapX / screenW) * 2 - 1;
    const ndcY = -(tapY / screenH) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.2 };
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const hits = raycaster.intersectObject(starsPoints);

    if (hits.length > 0 && hits[0].index != null) {
      const star = starsRef.current[hits[0].index];
      if (star) selectStar(star.id);
    } else {
      selectStar(null);
    }
  };

  handleDoubleTapRef.current = (tapX: number, tapY: number) => {
    const ndcX = (tapX / screenW) * 2 - 1;
    const ndcY = -(tapY / screenH) * 2 + 1;

    const fromX = rotation.current.x;
    const fromY = rotation.current.y;
    const targetX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, fromX + ndcY * 0.7));
    const targetY = isNorthLocked ? baseYRef.current : fromY - ndcX * 0.9;
    const start = Date.now();
    const duration = 240;

    if (gestureAnimRef.current != null) cancelAnimationFrame(gestureAnimRef.current);

    const animate = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      rotation.current.x = fromX + (targetX - fromX) * ease;
      rotation.current.y = fromY + (targetY - fromY) * ease;
      manualYawRef.current = rotation.current.y - baseYRef.current;

      if (t < 1) {
        gestureAnimRef.current = requestAnimationFrame(animate);
      }
    };

    gestureAnimRef.current = requestAnimationFrame(animate);
  };

  // PanResponder는 한 번만 생성 (useRef)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (_, gs) => {
        lastGS.current = { dx: gs.dx, dy: gs.dy, time: Date.now() };
      },

      onPanResponderMove: (e, gs) => {
        const touches = e.nativeEvent.touches;
        if (touches.length >= 2) {
          const t0 = touches[0];
          const t1 = touches[1];
          const dist = Math.hypot(t1.pageX - t0.pageX, t1.pageY - t0.pageY);

          if (pinchDistanceRef.current != null && cameraRef.current) {
            const delta = dist - pinchDistanceRef.current;
            const nextFov = Math.max(35, Math.min(95, cameraRef.current.fov - delta * 0.035));
            cameraRef.current.fov = nextFov;
            cameraRef.current.updateProjectionMatrix();
          }

          pinchDistanceRef.current = dist;
          return;
        }

        pinchDistanceRef.current = null;
        const ddx = gs.dx - lastGS.current.dx;
        const ddy = gs.dy - lastGS.current.dy;
        lastGS.current.dx = gs.dx;
        lastGS.current.dy = gs.dy;

        if (!isNorthLocked) {
          manualYawRef.current += ddx * 0.005;
          rotation.current.y = baseYRef.current + manualYawRef.current;
        }
        rotation.current.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, rotation.current.x + ddy * 0.005),
        );
      },

      onPanResponderRelease: (e, gs) => {
        pinchDistanceRef.current = null;
        const totalMove = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
        if (totalMove < 8 && Date.now() - lastGS.current.time < 300) {
          const now = Date.now();
          const dx = e.nativeEvent.locationX - lastTapRef.current.x;
          const dy = e.nativeEvent.locationY - lastTapRef.current.y;
          const nearTap = Math.hypot(dx, dy) < 24;
          const isDoubleTap = now - lastTapRef.current.time < 280 && nearTap;

          if (isDoubleTap) {
            handleDoubleTapRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY);
            lastTapRef.current = { x: 0, y: 0, time: 0 };
          } else {
            handleTapRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY);
            lastTapRef.current = {
              x: e.nativeEvent.locationX,
              y: e.nativeEvent.locationY,
              time: now,
            };
          }
        }
      },
    }),
  ).current;

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      const renderer = createRenderer(gl);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const camera = new THREE.PerspectiveCamera(75, w / h, 0.01, 20);
      camera.position.set(0, 0, 0);
      cameraRef.current = camera;

      // ── 별 파티클(초기 빈 geometry) ───────────────────────
      const starGeo = new THREE.BufferGeometry();
      const starMat = new THREE.PointsMaterial({
        size: 5,
        vertexColors: true,
        sizeAttenuation: false,
      });
      const starPoints = new THREE.Points(starGeo, starMat);
      starPointsMeshRef.current = starPoints;
      scene.add(starPoints);

      // ── 별자리 선(초기 빈 geometry) ───────────────────────
      const lineGeo = new THREE.BufferGeometry();
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x2a5090,
        transparent: true,
        opacity: 0.7,
      });
      const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
      lineSegmentsRef.current = lineSegments;
      scene.add(lineSegments);

      // ── 애니메이션 루프 ────────────────────────────────────
      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);
        scene.rotation.x = rotation.current.x;
        scene.rotation.y = rotation.current.y;
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      animate();
    },
    [],
  );

  useEffect(() => {
    if (calcTimerRef.current != null) {
      clearTimeout(calcTimerRef.current);
    }

    const delay = firstCalcRef.current ? 0 : calculationDebounceMs;
    firstCalcRef.current = false;

    calcTimerRef.current = setTimeout(() => {
      calculateStars(latitude, longitude, observationDate);
      calcTimerRef.current = null;
    }, delay) as unknown as number;

    return () => {
      if (calcTimerRef.current != null) {
        clearTimeout(calcTimerRef.current);
        calcTimerRef.current = null;
      }
    };
  }, [calculateStars, calculationDebounceMs, latitude, longitude, observationDate, magnitudeFilter]);

  useEffect(() => {
    const starsPoints = starPointsMeshRef.current;
    if (!starsPoints) return;

    const positions: number[] = [];
    const colors: number[] = [];

    for (const star of stars) {
      positions.push(star.x, star.y, star.z);
      const [r, g, b] = tempToColor(star.temperature);
      const dim = highlightedConstellation && star.constellation !== highlightedConstellation ? 0.22 : 1;
      colors.push(r * dim, g * dim, b * dim);
    }

    starsRef.current = stars;

    const nextGeo = new THREE.BufferGeometry();
    nextGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    nextGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const prevGeo = starsPoints.geometry;
    starsPoints.geometry = nextGeo;
    prevGeo.dispose();
  }, [stars, highlightedConstellation]);

  useEffect(() => {
    const lines = lineSegmentsRef.current;
    if (!lines) return;

    const starMap = new Map(stars.map((s) => [s.id, s]));
    const linePos: number[] = [];

    for (const line of constellationLines) {
      if (highlightedConstellation && line.name !== highlightedConstellation) continue;

      for (const [idA, idB] of line.starPairs) {
        const sa = starMap.get(idA);
        const sb = starMap.get(idB);
        if (sa && sb) {
          const aboveA = (sa.altitude ?? -90) >= 0;
          const aboveB = (sb.altitude ?? -90) >= 0;
          if (!showBelowHorizonLines && !aboveA && !aboveB) {
            continue;
          }
          linePos.push(sa.x, sa.y, sa.z, sb.x, sb.y, sb.z);
        }
      }
    }

    const nextGeo = new THREE.BufferGeometry();
    nextGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));

    const prevGeo = lines.geometry;
    lines.geometry = nextGeo;
    prevGeo.dispose();

    const mat = lines.material as THREE.LineBasicMaterial;
    mat.color.setHex(highlightedConstellation ? 0x6ca6ff : 0x2a5090);
    mat.opacity = highlightedConstellation ? 0.95 : 0.7;
  }, [stars, constellationLines, highlightedConstellation, showBelowHorizonLines]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
      if (focusAnimRef.current != null) cancelAnimationFrame(focusAnimRef.current);
      if (gestureAnimRef.current != null) cancelAnimationFrame(gestureAnimRef.current);
      if (calcTimerRef.current != null) {
        clearTimeout(calcTimerRef.current);
        calcTimerRef.current = null;
      }
      if (starPointsMeshRef.current) {
        starPointsMeshRef.current.geometry.dispose();
        (starPointsMeshRef.current.material as THREE.PointsMaterial).dispose();
      }
      if (lineSegmentsRef.current) {
        lineSegmentsRef.current.geometry.dispose();
        (lineSegmentsRef.current.material as THREE.LineBasicMaterial).dispose();
      }
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (isNorthLocked) {
      baseYRef.current = 0;
      manualYawRef.current = 0;
      rotation.current.y = baseYRef.current;
    }
  }, [isNorthLocked]);

  useEffect(() => {
    if (lineSegmentsRef.current) {
      lineSegmentsRef.current.visible = showConstellationLines;
    }
  }, [showConstellationLines]);

  useEffect(() => {
    if (!focusStarId || isNorthLocked) return;
    const target = starsRef.current.find((s) => s.id === focusStarId);
    if (!target) return;

    const x = target.x;
    const y = target.y;
    const z = target.z;

    const desiredY = Math.atan2(x, -z);
    const d = Math.sqrt(x * x + z * z);
    const desiredX = -Math.atan2(y, d);

    const fromX = rotation.current.x;
    const fromManualY = manualYawRef.current;
    const toManualY = desiredY - baseYRef.current;
    const toX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, desiredX));
    const duration = 300;
    const start = Date.now();

    if (focusAnimRef.current != null) cancelAnimationFrame(focusAnimRef.current);

    const animateFocus = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      manualYawRef.current = fromManualY + (toManualY - fromManualY) * ease;
      rotation.current.y = baseYRef.current + manualYawRef.current;
      rotation.current.x = fromX + (toX - fromX) * ease;

      if (t < 1) {
        focusAnimRef.current = requestAnimationFrame(animateFocus);
      } else {
        setFocusStarId(null);
      }
    };

    focusAnimRef.current = requestAnimationFrame(animateFocus);
  }, [focusStarId, isNorthLocked, setFocusStarId]);

  return (
    <View style={styles.container}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      {/* 터치 핸들링용 투명 오버레이 */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040812',
  },
});
