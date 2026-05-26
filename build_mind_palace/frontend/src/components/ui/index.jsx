import { motion } from 'framer-motion';
import styles from './ui.module.css';

export function Button({ children, variant = 'primary', size = 'md', loading, icon, ...props }) {
  return (
    <motion.button
      className={`${styles.btn} ${styles[variant]} ${styles[size]}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      {icon && !loading && <span className={styles.btnIcon}>{icon}</span>}
      {children}
    </motion.button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={styles.textarea} {...props} />
    </div>
  );
}

export function Skeleton({ width, height, radius }) {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height, borderRadius: radius ?? 'var(--radius)' }}
    />
  );
}

export function Badge({ children }) {
  return <span className={styles.badge}>{children}</span>;
}
