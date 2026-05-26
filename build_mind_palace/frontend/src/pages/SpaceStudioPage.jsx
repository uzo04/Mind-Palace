import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ImagePickerModal from '../components/image-picker/ImagePickerModal';
import BackLink from '../components/ui/BackLink';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ThreeDViewer from '../modules/scene-viewer/ThreeDViewer';
import { clearAutosave, readAutosave, useAutosave } from '../hooks/useAutosave';
import { contentService, locationService } from '../services/content.service';
import { spaceService } from '../services/space.service';
import { validateContentForm, validateLocationForm, validateSpaceForm } from '../utils/validation';

const contentTypes = [
  { value: 'text', label: 'Текст / факт' },
  { value: 'formula', label: 'Формула / понятие' },
  { value: 'image', label: 'Изображение / връзка' },
];

const contentTypeLabels = {
  text: 'Текст',
  formula: 'Формула',
  image: 'Изображение',
};

export default function SpaceStudioPage() {
  const { id } = useParams();
  const locationDraftKey = `mind-palace:space:${id}:location-draft`;
  const contentDraftKey = `mind-palace:space:${id}:content-draft`;
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeLocationId, setActiveLocationId] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [showSpacePicker, setShowSpacePicker] = useState(false);
  const [showEditLocationPicker, setShowEditLocationPicker] = useState(false);
  const [showEditContentPicker, setShowEditContentPicker] = useState(false);
  const [spaceDraft, setSpaceDraft] = useState({ title: '', description: '', coverImage: '' });
  const [locationForm, setLocationForm] = useState(() => readAutosave(locationDraftKey, { title: '', image: '' }));
  const [locationEditDraft, setLocationEditDraft] = useState({ title: '', order: 0, image: '' });
  const [contentForm, setContentForm] = useState(() => readAutosave(contentDraftKey, { type: 'text', value: '' }));
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [editingContentId, setEditingContentId] = useState('');
  const [editingContentValue, setEditingContentValue] = useState('');
  const [show3D, setShow3D] = useState(false);
  const locationAutosave = useAutosave(locationDraftKey, locationForm, {
    enabled: Boolean(locationForm.title || locationForm.image),
  });
  const contentAutosave = useAutosave(contentDraftKey, contentForm, {
    enabled: Boolean(contentForm.value),
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await spaceService.getOne(id);
      setSpace(data);
      setSpaceDraft({
        title: data.title || '',
        description: data.description || '',
        coverImage: data.coverImage || '',
      });
      const hasActive = data.Locations?.some((location) => location.id === activeLocationId);
      if (!hasActive) setActiveLocationId(data.Locations?.[0]?.id || '');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const locations = useMemo(() => space?.Locations || [], [space]);
  const activeLocation = useMemo(() => locations.find((item) => item.id === activeLocationId) || locations[0], [locations, activeLocationId]);

  useEffect(() => {
    if (!activeLocation) {
      setLocationEditDraft({ title: '', order: 0, image: '' });
      return;
    }

    setLocationEditDraft({
      title: activeLocation.title || '',
      order: activeLocation.order ?? 0,
      image: activeLocation.image || '',
    });
  }, [activeLocation?.id]);

  const saveSpace = async (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');

    const validationError = validateSpaceForm(spaceDraft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setActionBusy('space');
    try {
      await spaceService.update(id, {
        ...spaceDraft,
        title: spaceDraft.title.trim(),
        description: spaceDraft.description.trim(),
      });
      setFeedback('Пространството е обновено и синхронизирано.');
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionBusy('');
    }
  };

  const addLocation = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    const validationError = validateLocationForm(locationForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setActionBusy('location');
    try {
      await locationService.create({
        spaceId: id,
        title: locationForm.title.trim(),
        image: locationForm.image,
        order: locations.length,
      });
      setLocationForm({ title: '', image: '' });
      clearAutosave(locationDraftKey);
      setFeedback('Мястото е добавено и синхронизирано.');
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionBusy('');
    }
  };

  const addContent = async (e) => {
    e.preventDefault();
    if (!activeLocation) return;
    setError('');
    setFeedback('');

    const validationError = validateContentForm(contentForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setActionBusy('content');
    try {
      await contentService.create({
        locationId: activeLocation.id,
        type: contentForm.type,
        value: contentForm.value.trim(),
      });
      setContentForm({ type: 'text', value: '' });
      clearAutosave(contentDraftKey);
      setFeedback('Съдържанието е добавено и quiz-ът ще го използва автоматично.');
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionBusy('');
    }
  };

  const removeContent = async (contentId) => {
    setError('');
    try {
      await contentService.delete(contentId);
      setFeedback('Съдържанието е премахнато.');
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  const startEditContent = (item) => {
    setEditingContentId(item.id);
    setEditingContentValue(item.value);
  };

  const saveEditContent = async (contentId) => {
    setError('');
    try {
      await contentService.update(contentId, { value: editingContentValue });
      setEditingContentId('');
      setEditingContentValue('');
      setFeedback('Съдържанието е обновено.');
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  const saveLocationEdit = async (event) => {
    event.preventDefault();
    if (!activeLocation) return;

    setError('');
    setFeedback('');
    const validationError = validateLocationForm(locationEditDraft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setActionBusy('edit-location');
    try {
      await locationService.update(activeLocation.id, {
        title: locationEditDraft.title.trim(),
        order: Number(locationEditDraft.order),
        image: locationEditDraft.image,
      });
      setFeedback('Мястото е обновено и синхронизирано.');
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionBusy('');
    }
  };

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

  const removeLocation = (location) => {
    setConfirmAction({
      title: 'Изтриване на място',
      message: 'Мястото и съдържанието в него ще бъдат премахнати.',
      detail: location.title,
      confirmLabel: 'Изтриване',
      onConfirm: async () => {
        setError('');
        try {
          await locationService.delete(location.id);
          await load();
        } catch (err) {
          setError(String(err));
        }
      },
    });
  };

  if (loading) return <section className="section"><div className="container"><div className="glass-card">Зареждане…</div></div></section>;
  if (error && !space) return <section className="section"><div className="container"><div className="form-error">{error}</div></div></section>;
  if (!space) return null;

  return (
    <section className="section">
      <div className="container stack-lg">
        <BackLink to="/spaces">Назад към моите места</BackLink>

        {error && <div className="form-error">{error}</div>}
        <div className="page-header">
          <div>
            <span className="eyebrow">Промяна на пространство</span>
            <h1>{space.title}</h1>
            <p className="muted">Създавайте места и учебно съдържание, след което използвайте режима за преговор.</p>
          </div>
          <div className="space-card-actions">
            <Link className="btn btn-primary" to={`/spaces/${space.id}/recall`}>Преговор</Link>
            <button
              className={`btn ${show3D ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShow3D((value) => !value)}
            >
              {show3D ? '2D карта' : '3D изглед'}
            </button>
          </div>
        </div>

        {feedback && <div className="feedback-message">{feedback}</div>}

        <form className="glass-card editor-card stack-md" onSubmit={saveSpace}>
          <div className="sidebar-title-row"><h3>Данни за пространството</h3></div>
          <div className="input-grid">
            <label>
              Заглавие
              <input value={spaceDraft.title} onChange={(e) => setSpaceDraft({ ...spaceDraft, title: e.target.value })} required />
            </label>
            <label>
              Корица
              <input value={spaceDraft.coverImage} onChange={(e) => setSpaceDraft({ ...spaceDraft, coverImage: e.target.value })} />
            </label>
          </div>
          <label>
            Описание
            <textarea rows="3" value={spaceDraft.description} onChange={(e) => setSpaceDraft({ ...spaceDraft, description: e.target.value })} />
          </label>
          <div className="cover-picker compact-picker">
            {spaceDraft.coverImage ? <img src={spaceDraft.coverImage} alt="корица" className="cover-preview-large compact" /> : <div className="cover-preview-large compact cover-empty">Без корица</div>}
            <button type="button" className="btn btn-secondary" onClick={() => setShowSpacePicker(true)}>Избор на корица</button>
          </div>
          <button className="btn btn-primary" disabled={actionBusy === 'space'}>
            {actionBusy === 'space' ? 'Запазване…' : 'Запази пространството'}
          </button>
        </form>
    
        {show3D && (
          <div
            className="glass-card"
            style={{
              height: '420px',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius)',
            }}
          >
            <ThreeDViewer
              locations={locations}
              initialIndex={locations.findIndex((location) => location.id === activeLocation?.id)}
              onIndexChange={(index) => setActiveLocationId(locations[index]?.id || '')}
            />
          </div>
        )}

        <div className="studio-grid">
          <aside className="glass-card studio-sidebar stack-md">
            <div className="sidebar-title-row">
              <h3>Места</h3>
              <span className="chip">{locations.length}</span>
            </div>
            <div className="stack-sm">
              {locations.map((location, index) => (
                <button key={location.id} className={`location-row ${activeLocation?.id === location.id ? 'active' : ''}`} onClick={() => setActiveLocationId(location.id)}>
                  <span className="location-number">{index + 1}</span>
                  <span>{location.title}</span>
                </button>
              ))}
              {locations.length === 0 && <p className="muted">Все още няма добавени места.</p>}
            </div>
          </aside>

          <div className="studio-main stack-lg">
            <form className="glass-card editor-card stack-md" onSubmit={addLocation}>
              <div className="sidebar-title-row"><h3>Ново място</h3></div>
              <label>
                Заглавие на мястото
                <input value={locationForm.title} onChange={(e) => setLocationForm({ ...locationForm, title: e.target.value })} required />
              </label>
              <div className="cover-picker compact-picker">
                {locationForm.image ? <img src={locationForm.image} alt="място" className="cover-preview-large compact" /> : <div className="cover-preview-large compact cover-empty">Без изображение</div>}
                <button type="button" className="btn btn-secondary" onClick={() => setShowPicker(true)}>Избор на изображение</button>
              </div>
              <div className={`autosave-status ${locationAutosave.status === 'error' ? 'error' : ''}`}>
                {locationAutosave.status === 'saving' && 'Черновата се запазва…'}
                {locationAutosave.status === 'saved' && 'Черновата е запазена локално.'}
                {locationAutosave.status === 'error' && 'Черновата не можа да бъде запазена.'}
              </div>
              <button className="btn btn-primary" disabled={actionBusy === 'location'}>
                {actionBusy === 'location' ? 'Добавяне…' : 'Добавяне на място'}
              </button>
            </form>

            <div className="glass-card editor-card stack-md">
              <div className="sidebar-title-row">
                <h3>Избрано място</h3>
                {activeLocation && <button className="btn btn-danger" onClick={() => removeLocation(activeLocation)}>Изтриване</button>}
              </div>
              {activeLocation ? (
                <>
                  <div className="active-location-preview">
                    {activeLocation.image ? <img src={activeLocation.image} alt={activeLocation.title} /> : <div className="cover-empty full">Без изображение</div>}
                    <div>
                      <h2>{activeLocation.title}</h2>
                      <p className="muted">{(activeLocation.Contents || []).length} учебни елемента</p>
                    </div>
                  </div>

                  <form className="stack-md" onSubmit={saveLocationEdit}>
                    <div className="input-grid">
                      <label>
                        Име на мястото
                        <input value={locationEditDraft.title} onChange={(e) => setLocationEditDraft({ ...locationEditDraft, title: e.target.value })} required />
                      </label>
                      <label>
                        Ред
                        <input type="number" min="0" value={locationEditDraft.order} onChange={(e) => setLocationEditDraft({ ...locationEditDraft, order: e.target.value })} />
                      </label>
                    </div>
                    <div className="cover-picker compact-picker">
                      {locationEditDraft.image ? <img src={locationEditDraft.image} alt="място" className="cover-preview-large compact" /> : <div className="cover-preview-large compact cover-empty">Без изображение</div>}
                      <button type="button" className="btn btn-secondary" onClick={() => setShowEditLocationPicker(true)}>Избор на изображение</button>
                    </div>
                    <button className="btn btn-secondary" disabled={actionBusy === 'edit-location'}>
                      {actionBusy === 'edit-location' ? 'Запазване…' : 'Запази мястото'}
                    </button>
                  </form>

                  <form className="stack-md" onSubmit={addContent}>
                    <label>
                      Вид съдържание
                      <select value={contentForm.type} onChange={(e) => setContentForm({ ...contentForm, type: e.target.value })}>
                        {contentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                    </label>
                    <label>
                      Съдържание
                      {contentForm.type === 'image' ? (
                        <div className="stack-sm">
                          {contentForm.value ? <img src={contentForm.value} alt="съдържание" className="content-image-preview" /> : null}
                          <button type="button" className="btn btn-secondary" onClick={() => setShowContentPicker(true)}>Избор на изображение</button>
                        </div>
                      ) : (
                        <textarea rows="4" value={contentForm.value} onChange={(e) => setContentForm({ ...contentForm, value: e.target.value })} />
                      )}
                    </label>
                    <button className="btn btn-primary" disabled={actionBusy === 'content'}>
                      {actionBusy === 'content' ? 'Добавяне…' : 'Добавяне на съдържание'}
                    </button>
                  </form>

                  <div className={`autosave-status ${contentAutosave.status === 'error' ? 'error' : ''}`}>
                    {contentAutosave.status === 'saving' && 'Черновата се запазва…'}
                    {contentAutosave.status === 'saved' && 'Черновата е запазена локално.'}
                    {contentAutosave.status === 'error' && 'Черновата не можа да бъде запазена.'}
                  </div>

                  <div className="content-list stack-sm">
                    {(activeLocation.Contents || []).map((item) => (
                      <div key={item.id} className="content-item">
                        <div>
                          <span className="chip">{contentTypeLabels[item.type] || item.type}</span>
                          {editingContentId === item.id ? (
                            item.type === 'image' ? (
                              <div className="stack-sm">
                                {editingContentValue && <img src={editingContentValue} alt="съдържание" className="content-thumb" />}
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditContentPicker(true)}>Избор на ново изображение</button>
                              </div>
                            ) : (
                              <textarea
                                rows="3"
                                value={editingContentValue}
                                onChange={(event) => setEditingContentValue(event.target.value)}
                                style={{ width: '100%', marginTop: '6px' }}
                              />
                            )
                          ) : (
                            item.type === 'image'
                              ? <img src={item.value} alt="съдържание" className="content-thumb" />
                              : <p>{item.value}</p>
                          )}
                        </div>
                        <div className="stack-sm" style={{ flexDirection: 'row', gap: '6px' }}>
                          {editingContentId === item.id ? (
                            <>
                              <button className="btn btn-primary" onClick={() => saveEditContent(item.id)}>Запази</button>
                              <button className="btn btn-secondary" onClick={() => setEditingContentId('')}>Отказ</button>
                            </>
                          ) : (
                            <button className="btn btn-secondary" onClick={() => startEditContent(item)}>Редакция</button>
                          )}
                          <button className="btn btn-danger" onClick={() => removeContent(item.id)}>Изтриване</button>
                        </div>
                      </div>
                    ))}
                    {(activeLocation.Contents || []).length === 0 && <p className="muted">Още няма съдържание за това място.</p>}
                  </div>
                </>
              ) : <p className="muted">Нужно е избрано или ново място.</p>}
            </div>
          </div>
        </div>
      </div>

      {showPicker && <ImagePickerModal onSelect={(url) => { setLocationForm({ ...locationForm, image: url }); setShowPicker(false); }} onClose={() => setShowPicker(false)} />}
      {showContentPicker && <ImagePickerModal onSelect={(url) => { setContentForm({ ...contentForm, value: url }); setShowContentPicker(false); }} onClose={() => setShowContentPicker(false)} />}
      {showSpacePicker && <ImagePickerModal onSelect={(url) => { setSpaceDraft({ ...spaceDraft, coverImage: url }); setShowSpacePicker(false); }} onClose={() => setShowSpacePicker(false)} />}
      {showEditLocationPicker && <ImagePickerModal onSelect={(url) => { setLocationEditDraft({ ...locationEditDraft, image: url }); setShowEditLocationPicker(false); }} onClose={() => setShowEditLocationPicker(false)} />}
      {showEditContentPicker && <ImagePickerModal onSelect={(url) => { setEditingContentValue(url); setShowEditContentPicker(false); }} onClose={() => setShowEditContentPicker(false)} />}
      <ConfirmDialog
        action={confirmAction}
        busy={confirmBusy}
        onCancel={closeConfirm}
        onConfirm={runConfirmedAction}
      />
    </section>
  );
}
