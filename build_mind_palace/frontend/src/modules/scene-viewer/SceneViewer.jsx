import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SceneViewer.module.css';

const DEFAULT_HOTSPOTS = [
  { x: 50, y: 54 },
  { x: 28, y: 38 },
  { x: 72, y: 36 },
  { x: 35, y: 70 },
  { x: 66, y: 68 },
  { x: 50, y: 25 },
  { x: 18, y: 55 },
  { x: 82, y: 56 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function getHotspot(location, index, total) {
  if (location?.hotspotX != null && location?.hotspotY != null) {
    return { x: Number(location.hotspotX), y: Number(location.hotspotY) };
  }

  if (index < DEFAULT_HOTSPOTS.length) return DEFAULT_HOTSPOTS[index];

  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * 32,
    y: 52 + Math.sin(angle) * 26,
  };
}

function getNearestHotspotIndex(point, locations) {
  return locations.reduce((closest, location, index) => {
    const hotspot = getHotspot(location, index, locations.length);
    const distance = Math.hypot(point.x - hotspot.x, point.y - hotspot.y);
    return distance < closest.distance ? { index, distance } : closest;
  }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
}

function getRouteSegment(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const inset = Math.min(4.2, distance / 3);
  const ux = distance ? dx / distance : 0;
  const uy = distance ? dy / distance : 0;

  return {
    x1: from.x + ux * inset,
    y1: from.y + uy * inset,
    x2: to.x - ux * inset,
    y2: to.y - uy * inset,
  };
}

export default function SceneViewer({
  locations = [],
  initialIndex = 0,
  onIndexChange,
  spaceImage = '',
  spaceTitle = 'Мисловно пространство',
}) {
  const [current, setCurrent] = useState(() => clamp(initialIndex, 0, Math.max(locations.length - 1, 0)));
  const [direction, setDirection] = useState(0);
  const [mode, setMode] = useState('overview');
  const [transitionKind, setTransitionKind] = useState('map');
  const [selectedHotspot, setSelectedHotspot] = useState({ x: 50, y: 50 });

  const location = locations[current];
  const overviewImage = spaceImage || locations[0]?.image;

  useEffect(() => {
    setCurrent(clamp(initialIndex, 0, Math.max(locations.length - 1, 0)));
  }, [initialIndex, locations.length]);

  useEffect(() => {
    setMode('overview');
    setTransitionKind('map');
  }, [overviewImage]);

  const openLocation = useCallback((index) => {
    const hotspot = getHotspot(locations[index], index, locations.length);
    setSelectedHotspot(hotspot);
    setTransitionKind('map');
    setDirection(index >= current ? 1 : -1);
    setCurrent(index);
    setMode('location');
    onIndexChange?.(index);
  }, [current, locations, onIndexChange]);

  const handleOverviewClick = useCallback((event) => {
    if (!locations.length) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };

    openLocation(getNearestHotspotIndex(point, locations));
  }, [locations, openLocation]);

  const navigate = useCallback((dir) => {
    const next = current + dir;
    if (next < 0 || next >= locations.length) return;

    setTransitionKind('step');
    setSelectedHotspot(getHotspot(locations[next], next, locations.length));
    setDirection(dir);
    setCurrent(next);
    setMode('location');
    onIndexChange?.(next);
  }, [current, locations, onIndexChange]);

  const backToOverview = useCallback(() => {
    setTransitionKind('mapBack');
    setSelectedHotspot(getHotspot(location, current, locations.length));
    setMode('overview');
  }, [current, location, locations.length]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'ArrowRight') navigate(1);
      if (event.key === 'ArrowLeft') navigate(-1);
      if (event.key === 'Escape' && mode === 'location' && overviewImage) backToOverview();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [backToOverview, mode, navigate, overviewImage]);

  if (!location) {
    return (
      <div className={styles.empty}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <p>Все още няма места</p>
        <span>Маршрутът започва след добавяне на първо място.</span>
      </div>
    );
  }

  const variants = {
    enter: ({ direction: d, transitionKind: kind, hotspot }) => {
      if (kind === 'map') {
        return {
          opacity: 0,
          x: (50 - hotspot.x) * 5,
          y: (50 - hotspot.y) * 3.6,
          scale: 1.12,
          filter: 'blur(8px)',
        };
      }
      return { opacity: 0, x: d > 0 ? 80 : -80, y: 0, scale: 0.96, filter: 'blur(0px)' };
    },
    center: { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: ({ direction: d, transitionKind: kind, hotspot }) => {
      if (kind === 'mapBack') {
        return {
          opacity: 0,
          x: (50 - hotspot.x) * 5,
          y: (50 - hotspot.y) * 3.6,
          scale: 1.16,
          filter: 'blur(8px)',
        };
      }
      return { opacity: 0, x: d > 0 ? -80 : 80, y: 0, scale: 0.96, filter: 'blur(0px)' };
    },
  };

  const overviewVariants = {
    enter: ({ transitionKind: kind, hotspot }) => ({
      opacity: 0,
      x: kind === 'mapBack' ? (50 - hotspot.x) * 6 : 0,
      y: kind === 'mapBack' ? (50 - hotspot.y) * 4.2 : 0,
      scale: kind === 'mapBack' ? 1.62 : 0.96,
      filter: kind === 'mapBack' ? 'blur(10px)' : 'blur(0px)',
    }),
    center: { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: ({ transitionKind: kind, hotspot }) => ({
      opacity: 0,
      x: kind === 'map' ? (50 - hotspot.x) * 6 : 0,
      y: kind === 'map' ? (50 - hotspot.y) * 4.2 : 0,
      scale: kind === 'map' ? 2.72 : 0.98,
      filter: kind === 'map' ? 'blur(12px)' : 'blur(0px)',
    }),
  };

  const motionContext = { direction, transitionKind, hotspot: selectedHotspot };
  const routePoints = locations.map((item, index) => getHotspot(item, index, locations.length));

  return (
    <div className={styles.root}>
      <div
        className={`${styles.scene} ${mode === 'overview' ? styles.overviewScene : ''}`}
      >
        <AnimatePresence mode="wait" custom={motionContext}>
          {mode === 'overview' ? (
            <motion.div
              key="space-overview"
              className={styles.frame}
              custom={motionContext}
              variants={overviewVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${selectedHotspot.x}% ${selectedHotspot.y}%` }}
              onClick={handleOverviewClick}
            >
              {overviewImage ? (
                <img
                  src={overviewImage}
                  alt={spaceTitle}
                  className={styles.image}
                  draggable={false}
                />
              ) : (
                <div className={styles.placeholder}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M3 20V9l9-6 9 6v11" />
                    <path d="M8 20v-7a4 4 0 0 1 8 0v7" />
                    <path d="M2 20h20" />
                  </svg>
                  <span>Обща снимка</span>
                </div>
              )}

              <div className={styles.overviewVeil} />
              <div className={styles.scanLines} />

              <div className={styles.overviewLabel}>
                <span className={styles.locationIndex}>Маршрут</span>
                <h2 className={styles.locationTitle}>{spaceTitle}</h2>
                <p>{locations.length} запаметени места в маршрута</p>
              </div>

              <svg className={styles.routeOverlay} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <marker
                    id="route-arrow"
                    markerWidth="5"
                    markerHeight="5"
                    refX="4.1"
                    refY="2.5"
                    orient="auto"
                  >
                    <path d="M0 0 5 2.5 0 5z" />
                  </marker>
                </defs>
                {routePoints.slice(0, -1).map((point, index) => {
                  const next = routePoints[index + 1];
                  const segment = getRouteSegment(point, next);
                  return (
                    <line
                      key={`${point.x}-${point.y}-${next.x}-${next.y}`}
                      x1={segment.x1}
                      y1={segment.y1}
                      x2={segment.x2}
                      y2={segment.y2}
                      markerEnd="url(#route-arrow)"
                    />
                  );
                })}
              </svg>

              <div className={styles.hotspots}>
                {locations.map((item, index) => {
                  const hotspot = getHotspot(item, index, locations.length);
                  return (
                    <motion.button
                      key={item.id || index}
                      className={styles.hotspot}
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openLocation(index);
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.94 }}
                      title={item.title}
                    >
                      <span>{index + 1}</span>
                      <strong>{item.title}</strong>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={location.id}
              className={styles.frame}
              custom={motionContext}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {location.image ? (
                <img
                  src={location.image}
                  alt={location.title}
                  className={styles.image}
                  draggable={false}
                />
              ) : (
                <div className={styles.placeholder}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Без изображение</span>
                </div>
              )}

              <div className={styles.vignette} />
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'location' && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`label-${location.id}`}
                className={styles.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <span className={styles.locationIndex}>
                  {current + 1} / {locations.length}
                </span>
                <h2 className={styles.locationTitle}>{location.title}</h2>
              </motion.div>
            </AnimatePresence>

            {overviewImage && (
              <button className={styles.backToMap} onClick={backToOverview}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
                  <path d="M9 3v15M15 6v15" />
                </svg>
                Карта
              </button>
            )}

            <button
              className={`${styles.mapArrow} ${styles.mapArrowLeft}`}
              onClick={() => navigate(-1)}
              disabled={current === 0}
              aria-label="Предишно място"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className={`${styles.mapArrow} ${styles.mapArrowRight}`}
              onClick={() => navigate(1)}
              disabled={current === locations.length - 1}
              aria-label="Следващо място"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

      </div>
    </div>
  );
}
