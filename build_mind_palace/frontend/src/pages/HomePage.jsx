import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const highlights = [
  { title: 'Стаи на паметта', text: 'Темите се подреждат в мисловни стаи, така че всяка идея има свое място и контекст.' },
  { title: 'Смислени връзки', text: 'Фактите, образите и подсказките се свързват в маршрут, който води мисълта естествено.' },
  { title: 'Съзнателно припомняне', text: 'Преминаването през маршрута показва кои знания са усвоени и кои имат нужда от още преговор.' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Метод на локусите · учене чрез изводи</span>
            <h1>Превърни ученето в мисловно пространство.</h1>
            <p>
              Mind Palace помага учебният материал да се подреди в система от стаи, опорни точки и връзки.
              Вместо хаотично преговаряне, има ясен маршрут през ключовите идеи и по-уверено припомняне.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to={isAuthenticated ? '/spaces' : '/auth'}>
                {isAuthenticated ? 'Пространства' : 'Начало на работа'}
              </Link>
              <Link className="btn btn-secondary" to="/spaces/new">Създай пространство</Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="learning-map">
              <div className="map-header">
                <span>Карта на паметта</span>
                <strong>Пространство</strong>
              </div>
              <div className="map-canvas" aria-hidden="true">
                <svg className="map-route-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="50" y1="50" x2="26" y2="30" />
                  <line x1="50" y1="50" x2="74" y2="30" />
                  <line x1="50" y1="50" x2="26" y2="70" />
                  <line x1="50" y1="50" x2="74" y2="70" />
                </svg>
                <span className="map-node map-node-main">
                  <img className="map-node-logo" src="/mind-palace-map-mark.png" alt="" draggable={false} />
                </span>
                <span className="map-node map-node-a"><small>Факт</small></span>
                <span className="map-node map-node-b"><small>Образ</small></span>
                <span className="map-node map-node-c"><small>Връзка</small></span>
                <span className="map-node map-node-d"><small>Извод</small></span>
              </div>
              <div className="map-progress">
                <div>
                  <span>Усвоено</span>
                  <strong>78%</strong>
                </div>
                <div className="progress-track"><span /></div>
              </div>
              <div className="hero-stat-grid">
                <div className="hero-stat"><strong>Стаи</strong><span>12 места</span></div>
                <div className="hero-stat"><strong>Опори</strong><span>Факти и образи</span></div>
                <div className="hero-stat"><strong>Връзки</strong><span>Ясен маршрут</span></div>
                <div className="hero-stat"><strong>Насока</strong><span>Следваща стъпка</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Метод на локусите</span>
              <h2>Всяка идея получава място и всяко знание получава път.</h2>
            </div>
          </div>
          <div className="feature-grid">
            {highlights.map((item) => (
              <article key={item.title} className="glass-card feature-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
