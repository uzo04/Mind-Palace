import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BackLink from '../components/ui/BackLink';
import { spaceService } from '../services/space.service';

export default function QuizHubPage() {
  const { id } = useParams();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await spaceService.getAll();
        setSpaces(id ? data.filter((space) => space.id === id) : data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <section className="section"><div className="container"><div className="glass-card editor-card">Зареждане на викторини и тестове…</div></div></section>;
  }

  return (
    <section className="section">
      <div className="container stack-lg">
        <BackLink to={id ? `/spaces/${id}` : '/spaces'}>{id ? 'Назад към пространството' : 'Назад към моите места'}</BackLink>

        <div className="page-header learning-page-header">
          <div>
            <span className="eyebrow">Викторини и тестове</span>
            <h1>Самопроверка</h1>
            <p className="muted">Изберете пространство. Въпросите се генерират автоматично от добавеното учебно съдържание.</p>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        {spaces.length === 0 ? (
          <div className="glass-card empty-panel">
            <h3>Няма пространства за самопроверка</h3>
            <p>Създайте пространство и добавете места със съдържание.</p>
            <Link className="btn btn-primary" to="/spaces/new">Създай пространство</Link>
          </div>
        ) : (
          <div className="selection-grid">
            {spaces.map((space) => (
              <Link key={space.id} className="selection-card glass-card" to={`/spaces/${space.id}/quiz/start`}>
                <div className="selection-cover">
                  {space.coverImage ? <img src={space.coverImage} alt={space.title} /> : <div className="cover-placeholder">Тест</div>}
                </div>
                <div className="selection-card-body">
                  <span className="chip">Автоматичен тест</span>
                  <h3>{space.title}</h3>
                  <p>{space.description || 'Въпроси от местата и учебните елементи.'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
