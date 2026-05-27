import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { contentService } from '../../services/content.service';
import { Skeleton } from '../ui';
import styles from './ImagePicker.module.css';

const categoryLabels = {
  room: 'Стаи',
  office: 'Работни места',
  kitchen: 'Стаи',
  library: 'Читални',
  park: 'Природа',
  hall: 'Стаи',
  bedroom: 'Стаи',
  study: 'Работни места',
};

const categoryOrder = [
  'България',
  'Европа',
  'Азия',
  'Америка',
  'Африка',
  'Океания',
  'Природни места',
  'Други',
];

function normalizeCategory(category) {
  return categoryLabels[category] || category || 'Други';
}

function imageTitle(img) {
  return img.title || img.label || normalizeCategory(img.category);
}

export default function StockTab({ onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [brokenUrls, setBrokenUrls] = useState(() => new Set());

  useEffect(() => {
    contentService.getStockImages()
      .then(setImages)
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setBrokenUrls(new Set());
  }, [images]);

  const normalizedImages = useMemo(() => images.map((img) => ({
    ...img,
    displayTitle: imageTitle(img),
    displayCategory: normalizeCategory(img.category),
  })), [images]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(normalizedImages.map((img) => img.displayCategory)));
    return unique.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, 'bg');
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [normalizedImages]);

  const filtered = normalizedImages.filter((img) => {
    const normalizedQuery = query.trim().toLowerCase();
    const searchable = [
      img.url,
      img.sourceUrl,
      img.imageUrl,
      img.displayTitle,
      img.displayCategory,
    ].filter(Boolean).join(' ').toLowerCase();

    return (!selectedCategory || img.displayCategory === selectedCategory)
      && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  const markBroken = (url) => {
    setBrokenUrls((current) => {
      if (current.has(url)) return current;
      const next = new Set(current);
      next.add(url);
      return next;
    });
  };

  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} height="105px" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="Търсене по място или област…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className={styles.searchCount}>{filtered.length} места</span>
      </div>

      {categories.length > 1 && (
        <div className={styles.categoryRail} aria-label="Области">
          <button
            className={`${styles.categoryButton} ${selectedCategory === '' ? styles.categoryButtonActive : ''}`}
            type="button"
            aria-pressed={selectedCategory === ''}
            onClick={() => setSelectedCategory('')}
          >
            Всички
          </button>
          {categories.map((category) => (
            <button
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.categoryButtonActive : ''}`}
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Няма намерени места
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((img, i) => {
            const previewUrl = img.imageUrl || img.url || img;
            const selectedUrl = img.url || img.imageUrl || img;
            const isBroken = brokenUrls.has(previewUrl);
            return (
              <motion.div
                key={img.id || selectedUrl || i}
                className={styles.gridItem}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelect(selectedUrl)}
              >
                {isBroken ? (
                  <div className={styles.imageFallback} aria-hidden="true">
                    <span>{img.displayTitle}</span>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt={img.displayTitle}
                    loading="lazy"
                    onError={() => markBroken(previewUrl)}
                  />
                )}
                <span className={styles.gridCaption}>
                  <strong>{img.displayTitle}</strong>
                  <small>{img.displayCategory}</small>
                </span>
                <div className={styles.gridOverlay}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
