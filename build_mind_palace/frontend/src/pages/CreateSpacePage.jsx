import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spaceService } from '../services/space.service';
import ImagePickerModal from '../components/image-picker/ImagePickerModal';
import BackLink from '../components/ui/BackLink';
import { clearAutosave, readAutosave, useAutosave } from '../hooks/useAutosave';
import { validateSpaceForm } from '../utils/validation';

const DRAFT_KEY = 'mind-palace:create-space-draft';
const emptyForm = { title: '', description: '', coverImage: '' };

export default function CreateSpacePage() {
  const [form, setForm] = useState(() => readAutosave(DRAFT_KEY, emptyForm));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const navigate = useNavigate();
  const autosave = useAutosave(DRAFT_KEY, form, {
    enabled: Boolean(form.title || form.description || form.coverImage),
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateSpaceForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const created = await spaceService.create({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      clearAutosave(DRAFT_KEY);
      navigate(`/spaces/${created.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container narrow-container stack-lg">
        <BackLink to="/spaces">Назад към моите места</BackLink>

        <div className="page-header">
          <div>
            <span className="eyebrow">Създай пространство</span>
            <h1>Ново мисловно пространство</h1>
            <p className="muted">Тема, описание и корица за новото пространство. След това се подреждат отделните учебни места.</p>
          </div>
        </div>

        <form className="glass-card editor-card stack-md" onSubmit={submit}>
          <label>
            Заглавие
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>

          <label>
            Описание
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="5" />
          </label>

          <div className="cover-picker">
            {form.coverImage ? <img src={form.coverImage} alt="корица" className="cover-preview-large" /> : <div className="cover-preview-large cover-empty">Няма избрана корица</div>}
            <div className="stack-sm">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPicker(true)}>Избор на изображение</button>
              {form.coverImage && <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, coverImage: '' })}>Премахване</button>}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className={`autosave-status ${autosave.status === 'error' ? 'error' : ''}`}>
            {autosave.status === 'saving' && 'Автоматично запазване…'}
            {autosave.status === 'saved' && 'Черновата е запазена локално.'}
            {autosave.status === 'error' && 'Черновата не можа да бъде запазена локално.'}
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Създаване…' : 'Запази и продължи'}</button>
        </form>
      </div>

      {showPicker && <ImagePickerModal onSelect={(url) => { setForm({ ...form, coverImage: url }); setShowPicker(false); }} onClose={() => setShowPicker(false)} />}
    </section>
  );
}
