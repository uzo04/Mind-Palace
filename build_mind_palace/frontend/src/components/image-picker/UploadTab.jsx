import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { contentService } from '../../services/content.service';
import { Button } from '../ui';
import styles from './ImagePicker.module.css';

export default function UploadTab({ onSelect }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const uploadFile = async (nextFile) => {
    if (!nextFile) return;

    try {
      setError('');
      setUploading(true);
      const data = await contentService.upload(nextFile);
      const url = typeof data === 'string' ? data : data?.url || data?.imageUrl;
      if (!url) {
        throw new Error('Качването приключи, но сървърът не върна адрес на изображението.');
      }
      onSelect(url);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (nextFile) => {
    if (!nextFile) return;

    if (!nextFile.type.startsWith('image/')) {
      setError('Изберете PNG, JPG, WEBP или GIF изображение.');
      return;
    }

    if (nextFile.size > 5 * 1024 * 1024) {
      setError('Изображението трябва да бъде до 5 MB.');
      return;
    }

    setError('');
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    uploadFile(nextFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setError('');
  };

  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.uploadPreview}
      >
        <div className={styles.uploadActions}>
          {uploading ? (
            <Button loading size="sm">Качване...</Button>
          ) : (
            <Button onClick={() => uploadFile(file)} size="sm">
              Опитай отново
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={reset}>
            Друг избор
          </Button>
        </div>
        <img src={preview} alt="Преглед" />
        {error ? <p className={styles.uploadError}>{error}</p> : null}
      </motion.div>
    );
  }

  return (
    <div
      className={`${styles.uploadZone} ${drag ? styles.uploadZoneDrag : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className={styles.uploadIcon}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      </div>
      <p className={styles.uploadTitle}>Качи изображение</p>
      <p className={styles.uploadHint}>Избери от галерията или влачи файл тук - PNG, JPG, WEBP, GIF</p>
      {error ? <p className={styles.uploadError}>{error}</p> : null}
    </div>
  );
}
