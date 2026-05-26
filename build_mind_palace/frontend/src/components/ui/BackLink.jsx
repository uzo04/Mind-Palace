import { Link } from 'react-router-dom';

export default function BackLink({ to, children }) {
  return (
    <Link className="back-link" to={to}>
      <span className="back-link-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </Link>
  );
}
