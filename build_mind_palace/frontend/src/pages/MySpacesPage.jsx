import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { progressService } from '../services/content.service';
import { spaceService } from '../services/space.service';

export default function MySpacesPage() {
  const [spaces, setSpaces] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const spacesData = await spaceService.getAll();
      setSpaces(spacesData);

      try {
        setDashboard(await progressService.dashboard());
      } catch {
        setDashboard(null);
        setError('Статистиката временно не можа да се зареди. Пространствата остават достъпни.');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalLocations = useMemo(() => (
    spaces.reduce((sum, item) => sum + (item.locationCount ?? item.Locations?.length ?? 0), 0)
  ), [spaces]);
  const progressBySpace = useMemo(() => new Map((dashboard?.spaces || []).map((item) => [item.id, item])), [dashboard]);

  const closeConfirm = () => {
    if (!confirmBusy) setConfirmAction(null);
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;

    setConfirmBusy(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  const remove = (space) => {
    setConfirmAction({
      title: 'Изтриване на пространство',
      message: 'Това ще премахне пространството и всички негови учебни места.',
      detail: space.title,
      confirmLabel: 'Изтриване',
      onConfirm: async () => {
        setError('');
        try {
          await spaceService.delete(space.id);
          await load();
        } catch (err) {
          setError(String(err));
        }
      },
    });
  };

  return (
    <section className="section">
      <div className="container stack-lg">
        <div className="page-header">
          <div>
            <span className="eyebrow">Моите места</span>
            <h1>Управление на създадените пространства</h1>
            <p className="muted">Достъпни са преглед, редактиране и изтриване на пространствата.</p>
          </div>
          <Link to="/spaces/new" className="btn btn-primary">Създай пространство</Link>
        </div>

        {dashboard && <LearningDashboard dashboard={dashboard} />}

        <div className="stats-row dashboard-stats">
          <div className="stat-card glass-card"><strong>{spaces.length}</strong><span>Пространства</span></div>
          <div className="stat-card glass-card"><strong>{totalLocations}</strong><span>Учебни места</span></div>
          <div className="stat-card glass-card"><strong>{dashboard?.summary?.averageProgress || 0}%</strong><span>Среден напредък</span></div>
          <div className="stat-card glass-card"><strong>{dashboard?.summary?.attempts || 0}</strong><span>Самопроверки</span></div>
        </div>

        {loading ? <div className="glass-card">Зареждане…</div> : error ? <div className="form-error">{error}</div> : (
          <div className="space-grid">
            {spaces.map((space) => (
              <article
                key={space.id}
                className="glass-card space-card"
                onClick={() => navigate(`/spaces/${space.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="space-cover">
                  {space.coverImage ? <img src={space.coverImage} alt={space.title} /> : <div className="cover-placeholder">Mind Palace</div>}
                </div>
                <div className="space-card-body">
                  <div className="space-card-head">
                    <h3>{space.title}</h3>
                    <span className="chip">{space.locationCount ?? space.Locations?.length ?? 0} места</span>
                  </div>
                  <p>{space.description || 'Без описание.'}</p>
                  <SpaceProgressMini stats={progressBySpace.get(space.id)} />
                  <div className="space-card-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/spaces/${space.id}`);
                      }}
                    >
                      Преглед и редактиране
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(space);
                      }}
                    >
                      Изтриване
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {spaces.length === 0 && (
              <div className="glass-card empty-panel">
                <h3>Все още няма пространства</h3>
                <p>Първото пространство може да започне с нагледно подреждане на учебния материал.</p>
                <Link to="/spaces/new" className="btn btn-primary">Създай пространство</Link>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        action={confirmAction}
        busy={confirmBusy}
        onCancel={closeConfirm}
        onConfirm={runConfirmedAction}
      />
    </section>
  );
}

function LearningDashboard({ dashboard }) {
  const spaces = dashboard.spaces || [];
  const visibleSpaces = spaces.slice(0, 6);
  const latest = dashboard.history || [];
  const weakest = dashboard.insights?.weakest;
  const strongest = dashboard.insights?.strongest;

  return (
    <section className="learning-dashboard glass-card">
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">Напредък в ученето</span>
          <h2>{dashboard.summary.averageProgress}% общ напредък</h2>
        </div>
        <div className="dashboard-ring" style={{ '--value': `${dashboard.summary.averageProgress}%` }}>
          <span>{dashboard.summary.averageProgress}%</span>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-panel">
          <h3>Прогрес по пространства</h3>
          {visibleSpaces.length === 0 ? (
            <p className="muted">Добавете пространство, за да се появят данни за напредък.</p>
          ) : visibleSpaces.map((space) => (
            <div className="progress-row" key={space.id}>
              <div>
                <strong>{space.title}</strong>
                <span>{space.completedLocations}/{space.locations} места</span>
              </div>
              <div className="progress-bar" aria-label={`${space.progress}%`}>
                <span style={{ width: `${space.progress}%` }} />
              </div>
              <b>{space.progress}%</b>
            </div>
          ))}
        </div>

        <div className="dashboard-panel">
          <h3>История</h3>
          {latest.length === 0 ? (
            <p className="muted">Още няма записани сесии за преговаряне или самопроверка.</p>
          ) : latest.slice(0, 5).map((entry, index) => (
            <div className="history-row" key={`${entry.spaceId}-${entry.at}-${index}`}>
              <span>{entry.type === 'quiz' ? 'Тест' : 'Преговор'}</span>
              <div>
                <strong>{entry.spaceTitle}</strong>
                <small>{new Date(entry.at).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })}</small>
              </div>
              {Number.isFinite(entry.percent) && <b>{entry.percent}%</b>}
            </div>
          ))}
        </div>

        <div className="dashboard-panel insights-panel">
          <h3>Насоки</h3>
          <p>{dashboard.insights?.recommendation}</p>
          <div className="insight-pills">
            {weakest && <span>Фокус: {weakest.title} {weakest.progress}%</span>}
            {strongest && <span>Най-стабилно: {strongest.title} {strongest.progress}%</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpaceProgressMini({ stats }) {
  const progress = stats?.progress || 0;

  return (
    <div className="space-progress-mini">
      <div className="space-progress-copy">
        <span>Напредък</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-bar compact">
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
