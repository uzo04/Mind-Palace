import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BackLink from '../components/ui/BackLink';
import { spaceService } from '../services/space.service';

export default function RecallModePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(id || '');
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSpace, setLoadingSpace] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSpaces = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await spaceService.getAll();
        setSpaces(data);
        const firstId = id || data[0]?.id || '';
        setSelectedSpaceId(firstId);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadSpaces();
  }, [id]);

  useEffect(() => {
    if (!selectedSpaceId) {
      setSelectedSpace(null);
      return;
    }

    const loadSpace = async () => {
      setLoadingSpace(true);
      setError('');
      try {
        setSelectedSpace(await spaceService.getOne(selectedSpaceId));
      } catch (err) {
        setError(String(err));
      } finally {
        setLoadingSpace(false);
      }
    };

    loadSpace();
  }, [selectedSpaceId]);

  const locations = useMemo(() => selectedSpace?.Locations || [], [selectedSpace]);

  if (loading) {
    return <section className="section"><div className="container"><div className="glass-card editor-card">Зареждане на режим Преговор...</div></div></section>;
  }

  return (
    <section className="section">
      <div className="container stack-lg">
        <BackLink to={id ? `/spaces/${id}` : '/spaces'}>{id ? 'Назад към пространството' : 'Назад към моите места'}</BackLink>

        <div className="page-header learning-page-header">
          <div>
            <span className="eyebrow">Recall Mode</span>
            <h1>Режим Преговор</h1>
            <p className="muted">Изберете мисловно пространство и място, от което да започне визуалното припомняне.</p>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        {spaces.length === 0 ? (
          <div className="glass-card empty-panel">
            <h3>Няма създадени пространства</h3>
            <p>Създайте първо пространство и добавете учебни места.</p>
            <Link className="btn btn-primary" to="/spaces/new">Създай пространство</Link>
          </div>
        ) : loadingSpace ? (
          <div className="glass-card editor-card">Зареждане на местата...</div>
        ) : locations.length === 0 ? (
          <div className="glass-card empty-panel">
            <h3>Няма места за преговор</h3>
            <p>Добавете поне едно учебно място в избраното пространство.</p>
            <Link className="btn btn-primary" to={`/spaces/${selectedSpaceId}`}>Добавяне на места</Link>
          </div>

        ) : !id ? (
          <div className="space-grid">
            {spaces.map((space) => (
              <article
                key={space.id}
                className="glass-card space-card"
                onClick={() => navigate(`/spaces/${space.id}/recall/0`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="space-cover">
                  {space.coverImage ? (
                    <img src={space.coverImage} alt={space.title} />
                  ) : (
                    <div className="cover-placeholder">Mind Palace</div>
                  )}
                </div>

                <div className="space-card-body">
                  <div className="space-card-head">
                    <h3>{space.title}</h3>
                    <span className="chip">{space.locationCount ?? space.Locations?.length ?? 0} места</span>
                  </div>
                  <p>{space.description || 'Без описание.'}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="selection-grid">
            {locations.map((location, index) => (
              <Link key={location.id} className="selection-card glass-card" to={`/spaces/${selectedSpaceId}/recall/${index}`}>
                <div className="selection-cover">
                  {location.image ? <img src={location.image} alt={location.title} /> : <div className="cover-placeholder">Място {index + 1}</div>}
                </div>
                <div className="selection-card-body">
                  <span className="chip">Стъпка {index + 1}</span>
                  <h3>{location.title}</h3>
                  <p>{(location.Contents || []).length} учебни елемента</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
