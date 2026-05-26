import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BackLink from '../components/ui/BackLink';
import { readAutosave, useAutosave } from '../hooks/useAutosave';
import SceneViewer from '../modules/scene-viewer/SceneViewer';
import ThreeDViewer from '../modules/scene-viewer/ThreeDViewer';
import { progressService } from '../services/content.service';
import { spaceService } from '../services/space.service';

function contentLabel(type) {
  if (type === 'formula') return 'Формула';
  if (type === 'image') return 'Изображение';
  return 'Текст';
}

export default function RecallPage() {
  const { id, startIndex } = useParams();
  const recallDraftKey = `mind-palace:space:${id}:recall-session`;
  const savedRecall = readAutosave(recallDraftKey, { currentIndex: 0, revealed: false });
  const [space, setSpace] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [currentIndex, setCurrentIndex] = useState(Number(startIndex) || savedRecall.currentIndex || 0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [revealed, setRevealed] = useState(Boolean(savedRecall.revealed));
  const [syncing, setSyncing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  const stageRef = useRef(null);

  const locations = useMemo(() => space?.Locations || [], [space]);
  const activeLocation = locations[currentIndex];
  const visitedIds = progress?.visitedLocationIds || [];
  const progressPercent = locations.length ? Math.round((visitedIds.length / locations.length) * 100) : 0;
  const activeVisited = activeLocation ? visitedIds.includes(activeLocation.id) : false;

  useAutosave(recallDraftKey, { currentIndex, revealed }, {
    enabled: !loading && locations.length > 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setPanelOpen(false);
      setHasSelectedLocation(false);

      try {
        const [spaceData, progressData] = await Promise.all([
          spaceService.getOne(id),
          progressService.get(id),
        ]);
        const loadedLocations = spaceData.Locations || [];
        const progressIndex = loadedLocations.findIndex((location) => location.id === progressData.currentLocationId);
        const restoredIndex = Math.min(savedRecall.currentIndex || 0, Math.max(loadedLocations.length - 1, 0));

        setSpace(spaceData);
        setProgress(progressData);
        setCurrentIndex(Number(startIndex) || (progressIndex >= 0 ? progressIndex : restoredIndex));
        setRevealed(false);
        setHasSelectedLocation(false);
        setPanelOpen(false);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const syncCurrentLocation = async (index, { openPanel = true, reveal = false } = {}) => {
    const nextLocation = locations[index];
    if (!nextLocation || syncing) return;

    const previousIndex = currentIndex;
    const previousPanelOpen = panelOpen;
    const previousRevealed = revealed;
    const previousSelectedState = hasSelectedLocation;

    setCurrentIndex(index);
    setHasSelectedLocation(true);
    setPanelOpen(openPanel);
    setRevealed(reveal);
    setFeedback('');
    setSyncing(true);

    try {
      const updated = await progressService.update(id, { currentLocationId: nextLocation.id });
      setProgress(updated);
    } catch (err) {
      setCurrentIndex(previousIndex);
      setHasSelectedLocation(previousSelectedState);
      setPanelOpen(previousPanelOpen);
      setRevealed(previousRevealed);
      setError(String(err));
    } finally {
      setSyncing(false);
    }
  };

  const markLocationLearned = async () => {
    if (!activeLocation) return;

    setError('');
    setFeedback('');
    setSyncing(true);
    try {
      const updated = await progressService.update(id, { visitedLocationId: activeLocation.id });
      setProgress(updated);
      setRevealed(true);
      setFeedback('Мястото е отбелязано като научено.');
    } catch (err) {
      setError(String(err));
    } finally {
      setSyncing(false);
    }
  };

  const markComplete = async () => {
    setError('');
    setFeedback('');
    setSyncing(true);
    try {
      const updated = await progressService.update(id, { completed: true });
      setProgress(updated);
      setFeedback('Преговорът е завършен и синхронизиран.');
    } catch (err) {
      setError(String(err));
    } finally {
      setSyncing(false);
    }
  };

  const goNext = async () => {
    if (currentIndex < locations.length - 1) {
      await syncCurrentLocation(currentIndex + 1);
      return;
    }
    await markComplete();
  };

  const goPrevious = async () => {
    if (currentIndex > 0) await syncCurrentLocation(currentIndex - 1);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await stageRef.current?.requestFullscreen();
      }
    } catch {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) return (
    <section className="section">
      <div className="container">
        <div className="glass-card editor-card">Зареждане на режима за преговаряне...</div>
      </div>
    </section>
  );

  if (error && !space) return (
    <section className="section">
      <div className="container stack-md">
        <BackLink to={`/spaces/${id}`}>Назад към пространството</BackLink>
        <div className="form-error">{error}</div>
      </div>
    </section>
  );

  if (!space) return null;

  if (locations.length === 0) return (
    <section className="section">
      <div className="container stack-lg">
        <BackLink to={`/spaces/${id}`}>Назад към пространството</BackLink>
        <div className="glass-card empty-panel">
          <h3>Няма маршрут за преговаряне</h3>
          <p>Добавете поне едно учебно място и съдържание, за да започне структурираният поток.</p>
          <Link className="btn btn-primary" to={`/spaces/${id}`}>Добавяне на места</Link>
        </div>
      </div>
    </section>
  );

  return (
    <section className="section recall-layout-section">
      <div className="container stack-lg">
        {error && <div className="form-error">{error}</div>}
        <div className="recall-topline">
          <BackLink to={`/spaces/${id}`}>Назад към пространството</BackLink>
          <div className="recall-actions">
            <button className="btn btn-primary" onClick={markComplete} disabled={syncing || progressPercent === 100}>
              {progressPercent === 100 ? 'Преминато' : 'Завърши'}
            </button>
          </div>
        </div>

        <div className="recall-header">
          <div>
            <span className="eyebrow">Режим Преговор</span>
            <h1>{space.title}</h1>
          </div>
          <div className="recall-meta">
            <span className="chip">{locations.length} места</span>
            <span className="chip">{progressPercent}% напредък</span>
            <span className="chip" style={{ background: progressPercent === 100 ? 'rgba(5,150,105,0.1)' : undefined, borderColor: progressPercent === 100 ? 'rgba(5,150,105,0.22)' : undefined, color: progressPercent === 100 ? '#047857' : undefined }}>
              {progressPercent === 100 ? 'Завършено' : 'В ход'}
            </span>
          </div>
        </div>

        {feedback && <div className="feedback-message">{feedback}</div>}
        {syncing && <div className="autosave-status">Синхронизиране на напредъка...</div>}

        <div className="recall-learning-flow">
          <aside className="recall-route-panel glass-card">
            <div className="recall-route-head">
              <div>
                <span className="eyebrow">Маршрут</span>
                <h3>Учебни стъпки</h3>
              </div>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="recall-route-list">
              {locations.map((location, index) => {
                const isActive = index === currentIndex;
                const isDone = visitedIds.includes(location.id);
                return (
                  <button
                    key={location.id}
                    className={`recall-route-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                    onClick={() => syncCurrentLocation(index)}
                  >
                    <span>{index + 1}</span>
                    <div>
                      <strong>{location.title}</strong>
                      <small>{isDone ? 'Научено' : isActive ? 'Текуща стъпка' : `${(location.Contents || []).length} елемента`}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className={`recall-stage ${isFullscreen ? 'is-fullscreen' : ''}`} ref={stageRef}>
            <div className="recall-stage-toolbar">
              <div className="recall-stage-actions">
                <button
                  className="btn btn-secondary btn-compact"
                  onClick={() => setViewMode((mode) => (mode === 'map' ? '3d' : 'map'))}
                  title={viewMode === 'map' ? '3D изглед' : '2D карта'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {viewMode === 'map'
                      ? <><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></>
                      : <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>
                    }
                  </svg>
                  {viewMode === 'map' ? '3D изглед' : '2D карта'}
                </button>
                <button
                  className="btn btn-secondary btn-compact"
                  onClick={() => setRouteOpen((open) => !open)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                  {routeOpen ? 'Скрий маршрута' : 'Маршрут'}
                </button>
                {hasSelectedLocation && activeLocation && (
                  <button
                    className="btn btn-secondary btn-compact"
                    onClick={() => setPanelOpen((o) => !o)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 5h16M4 12h16M4 19h10" />
                    </svg>
                    {panelOpen ? 'Скрий' : 'Съдържание'}
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-compact"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Изход от цял екран' : 'Цял екран'}
                  aria-label={isFullscreen ? 'Изход от цял екран' : 'Цял екран'}
                >
                  {isFullscreen ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" />
                    </svg>
                  )}
                  {isFullscreen ? 'Изход' : 'Цял екран'}
                </button>
              </div>
            </div>

            {routeOpen && (
              <div className="recall-route-strip glass-card">
                <div className="recall-route-strip-head">
                  <div>
                    <span className="eyebrow">Маршрут</span>
                    <h3>Учебни стъпки</h3>
                  </div>
                  <strong>{progressPercent}%</strong>
                </div>
                <div className="progress-bar compact">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="recall-route-inline-list">
                  {locations.map((location, index) => {
                    const isActive = index === currentIndex;
                    const isDone = visitedIds.includes(location.id);
                    return (
                      <button
                        key={location.id}
                        className={`recall-route-chip ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                        onClick={() => syncCurrentLocation(index)}
                      >
                        <span>{index + 1}</span>
                        <div>
                          <strong>{location.title}</strong>
                          <small>{isDone ? 'Научено' : isActive ? 'Текуща стъпка' : `${(location.Contents || []).length} елемента`}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`recall-viewer-grid ${panelOpen && activeLocation ? 'with-panel' : ''}`}>
              <div className="recall-shell glass-card">
                {viewMode === '3d' ? (
                  <ThreeDViewer
                    locations={locations}
                    initialIndex={currentIndex}
                    selectedIndex={hasSelectedLocation ? currentIndex : null}
                    onIndexChange={(nextIndex) => syncCurrentLocation(nextIndex)}
                    spaceTitle={space.title}
                  />
                ) : (
                  <SceneViewer
                    locations={locations}
                    initialIndex={currentIndex}
                    onIndexChange={(nextIndex) => syncCurrentLocation(nextIndex)}
                    spaceImage={space.coverImage}
                    spaceTitle={space.title}
                  />
                )}
              </div>

              {panelOpen && activeLocation && (
                <aside className="recall-info-panel glass-card">
                  <div className="recall-panel-head">
                    <div>
                      <span className="eyebrow">Активно припомняне</span>
                      <h3>{activeLocation.title}</h3>
                    </div>
                    <button className="recall-panel-close" onClick={() => setPanelOpen(false)} aria-label="Затвори">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {activeLocation.image && (
                    <img
                      src={activeLocation.image}
                      alt={activeLocation.title}
                      className="recall-panel-image"
                    />
                  )}

                  {!revealed ? (
                    <div className="recall-prompt">
                      <span>1</span>
                      <p>Опитайте първо да възстановите съдържанието по образа и мястото. След това покажете материала и отбележете дали е усвоен.</p>
                      <button className="btn btn-primary" onClick={() => setRevealed(true)}>Покажи съдържание</button>
                    </div>
                  ) : (
                    <div className="recall-content-list">
                      {(activeLocation.Contents || []).length === 0 && (
                        <p className="muted">Няма съдържание.</p>
                      )}
                      {(activeLocation.Contents || []).map((item, i) => (
                        <div key={item.id || i} className="recall-content-item">
                          <span className="recall-content-type">
                            {contentLabel(item.type)}
                          </span>
                          {item.type === 'image'
                            ? <img src={item.value} alt="съдържание" className="recall-content-image" />
                            : <p className="recall-content-text">{item.value}</p>
                          }
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="recall-flow-actions">
                    <button className="btn btn-secondary" onClick={goPrevious} disabled={currentIndex === 0 || syncing}>Назад</button>
                    <button className="btn btn-primary" onClick={markLocationLearned} disabled={syncing || activeVisited}>
                      {activeVisited ? 'Научено' : 'Запомних'}
                    </button>
                    <button className="btn btn-secondary" onClick={goNext} disabled={syncing}>
                      {currentIndex === locations.length - 1 ? 'Финал' : 'Следващо'}
                    </button>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
