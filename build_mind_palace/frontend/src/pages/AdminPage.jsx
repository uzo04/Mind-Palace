import { useEffect, useMemo, useState } from 'react';
import BackLink from '../components/ui/BackLink';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { adminService } from '../services/admin.service';
import { emailPattern } from '../utils/validation';

const overviewLabels = {
  users: 'Потребители',
  spaces: 'Пространства',
  locations: 'Места',
  contents: 'Материали',
  images: 'Изображения',
};

const emptyUserDraft = { username: '', email: '' };

function roleLabel(role) {
  return role === 'admin' ? 'Управител' : 'Потребител';
}

function countLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function toUserDraft(user) {
  return {
    username: user?.username || '',
    email: user?.email || '',
  };
}

function toSpaceDraft(space) {
  return {
    title: space?.title || '',
    description: space?.description || '',
    coverImage: space?.coverImage || '',
  };
}

function toLocationDraft(location) {
  return {
    title: location?.title || '',
    order: location?.order ?? 0,
    image: location?.image || '',
  };
}

function toContentDraft(content) {
  return {
    type: content?.type || 'text',
    value: content?.value || '',
  };
}

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({ url: '', category: '' });
  const [newUserForm, setNewUserForm] = useState({ username: '', email: '', password: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userDraft, setUserDraft] = useState(emptyUserDraft);
  const [spaces, setSpaces] = useState([]);
  const [spaceDrafts, setSpaceDrafts] = useState({});
  const [locationDrafts, setLocationDrafts] = useState({});
  const [contentDrafts, setContentDrafts] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const selectedLocationCount = useMemo(
    () => spaces.reduce((sum, space) => sum + (space.Locations?.length || 0), 0),
    [spaces]
  );

  const loadSpaces = async (userId) => {
    if (!userId) {
      setSpaces([]);
      setSpaceDrafts({});
      setLocationDrafts({});
      setContentDrafts({});
      return;
    }

    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await adminService.userSpaces(userId);
      setSpaces(data);
      setSpaceDrafts(Object.fromEntries(data.map((space) => [space.id, toSpaceDraft(space)])));
      setLocationDrafts(Object.fromEntries(
        data.flatMap((space) => (space.Locations || []).map((location) => [location.id, toLocationDraft(location)]))
      ));
      setContentDrafts(Object.fromEntries(
        data.flatMap((space) => (space.Locations || []).flatMap((location) => (
          (location.Contents || []).map((content) => [content.id, toContentDraft(content)])
        )))
      ));
    } catch (err) {
      setDetailError(String(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const selectUser = async (user) => {
    setSelectedUserId(user?.id || '');
    setUserDraft(toUserDraft(user));
    await loadSpaces(user?.id);
  };

  const load = async (preferredUserId = selectedUserId) => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, userData, imageData] = await Promise.all([
        adminService.overview(),
        adminService.users(),
        adminService.images(),
      ]);
      setOverview(overviewData);
      setUsers(userData);
      setImages(imageData);

      const nextUser = userData.find((user) => user.id === preferredUserId) || userData[0] || null;
      await selectUser(nextUser);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(''); }, []);

  const askDelete = (action) => {
    setConfirmAction({
      confirmLabel: 'Изтриване',
      ...action,
    });
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

  const saveUser = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;

    setDetailError('');
    if (userDraft.username.trim().length < 3 || userDraft.username.trim().length > 30) {
      setDetailError('Потребителското име трябва да бъде между 3 и 30 символа.');
      return;
    }
    if (!emailPattern.test(userDraft.email.trim())) {
      setDetailError('Въведете валиден имейл адрес.');
      return;
    }

    try {
      const updated = await adminService.updateUser(selectedUser.id, {
        username: userDraft.username.trim(),
        email: userDraft.email.trim(),
      });
      setUsers((current) => current.map((user) => (
        user.id === updated.id ? { ...user, ...updated, Spaces: user.Spaces } : user
      )));
      setUserDraft(toUserDraft(updated));
    } catch (err) {
      setDetailError(String(err));
    }
  };

  const removeUser = (user) => {
    askDelete({
      title: 'Изтриване на потребителски профил',
      message: 'Профилът и всички свързани с него пространства ще бъдат премахнати.',
      detail: user.email,
      onConfirm: async () => {
        setError('');
        try {
          await adminService.deleteUser(user.id);
          await load(user.id === selectedUserId ? '' : selectedUserId);
        } catch (err) {
          setError(String(err));
        }
      },
    });
  };

  const saveSpace = async (event, spaceId) => {
    event.preventDefault();
    setDetailError('');
    const draft = spaceDrafts[spaceId] || {};
    if (!draft.title?.trim()) {
      setDetailError('Заглавието на пространството е задължително.');
      return;
    }

    try {
      const updated = await adminService.updateSpace(spaceId, {
        ...draft,
        title: draft.title.trim(),
        description: draft.description?.trim() || '',
      });
      setSpaces((current) => current.map((space) => (
        space.id === updated.id ? { ...space, ...updated, Locations: space.Locations } : space
      )));
      setSpaceDrafts((current) => ({ ...current, [updated.id]: toSpaceDraft(updated) }));
    } catch (err) {
      setDetailError(String(err));
    }
  };

  const removeSpace = (space) => {
    askDelete({
      title: 'Изтриване на пространство',
      message: 'Пространството и всички места в него ще бъдат премахнати.',
      detail: space.title,
      onConfirm: async () => {
        setDetailError('');
        try {
          await adminService.deleteSpace(space.id);
          await loadSpaces(selectedUserId);
          setOverview(await adminService.overview());
        } catch (err) {
          setDetailError(String(err));
        }
      },
    });
  };

  const saveLocation = async (event, locationId) => {
    event.preventDefault();
    setDetailError('');
    const draft = locationDrafts[locationId] || {};
    const order = Number(draft.order);
    if (!draft.title?.trim()) {
      setDetailError('Заглавието на мястото е задължително.');
      return;
    }
    if (!Number.isInteger(order) || order < 0) {
      setDetailError('Редът на мястото трябва да бъде неотрицателно цяло число.');
      return;
    }

    try {
      const updated = await adminService.updateLocation(locationId, {
        ...draft,
        title: draft.title.trim(),
        order,
      });
      setSpaces((current) => current.map((space) => ({
        ...space,
        Locations: (space.Locations || []).map((location) => (
          location.id === updated.id ? { ...location, ...updated } : location
        )),
      })));
      setLocationDrafts((current) => ({ ...current, [updated.id]: toLocationDraft(updated) }));
    } catch (err) {
      setDetailError(String(err));
    }
  };

  const removeLocation = (location) => {
    askDelete({
      title: 'Изтриване на място',
      message: 'Това място ще бъде премахнато от избраното пространство.',
      detail: location.title,
      onConfirm: async () => {
        setDetailError('');
        try {
          await adminService.deleteLocation(location.id);
          await loadSpaces(selectedUserId);
          setOverview(await adminService.overview());
        } catch (err) {
          setDetailError(String(err));
        }
      },
    });
  };

  const saveContent = async (event, contentId) => {
    event.preventDefault();
    setDetailError('');
    const draft = contentDrafts[contentId] || {};
    if (!draft.value?.trim()) {
      setDetailError('Съдържанието е задължително.');
      return;
    }

    try {
      const updated = await adminService.updateContent(contentId, {
        type: draft.type,
        value: draft.value.trim(),
      });
      setSpaces((current) => current.map((space) => ({
        ...space,
        Locations: (space.Locations || []).map((location) => ({
          ...location,
          Contents: (location.Contents || []).map((content) => (
            content.id === updated.id ? { ...content, ...updated } : content
          )),
        })),
      })));
      setContentDrafts((current) => ({ ...current, [updated.id]: toContentDraft(updated) }));
    } catch (err) {
      setDetailError(String(err));
    }
  };

  const removeContent = (content) => {
    askDelete({
      title: 'Изтриване на учебен елемент',
      message: 'Този учебен елемент ще бъде премахнат от мястото.',
      detail: content.value,
      onConfirm: async () => {
        setDetailError('');
        try {
          await adminService.deleteContent(content.id);
          await loadSpaces(selectedUserId);
          setOverview(await adminService.overview());
        } catch (err) {
          setDetailError(String(err));
        }
      },
    });
  };

  const createUser = async (event) => {
    event.preventDefault();
    setError('');
    if (newUserForm.username.trim().length < 3 || newUserForm.username.trim().length > 30) {
      setError('Потребителското име трябва да бъде между 3 и 30 символа.');
      return;
    }
    if (!emailPattern.test(newUserForm.email.trim())) {
      setError('Въведете валиден имейл адрес.');
      return;
    }
    if (newUserForm.password.length < 6) {
      setError('Паролата трябва да бъде поне 6 символа.');
      return;
    }
    try {
      await adminService.createUser({
        username: newUserForm.username.trim(),
        email: newUserForm.email.trim(),
        password: newUserForm.password,
      });
      setNewUserForm({ username: '', email: '', password: '' });
      await load('');
    } catch (err) {
      setError(String(err));
    }
  };

  const addImage = async (event) => {
    event.preventDefault();
    setError('');
    const url = form.url.trim();
    if (!url || (!url.startsWith('/uploads/') && !/^https?:\/\/\S+\.\S+/.test(url))) {
      setError('Въведете валиден адрес на изображение.');
      return;
    }

    try {
      await adminService.createImage({ url, category: form.category.trim() });
      setForm({ url: '', category: '' });
      const [overviewData, imageData] = await Promise.all([
        adminService.overview(),
        adminService.images(),
      ]);
      setOverview(overviewData);
      setImages(imageData);
    } catch (err) {
      setError(String(err));
    }
  };

  const removeImage = (image) => {
    askDelete({
      title: 'Изтриване на изображение',
      message: 'Изображението ще бъде премахнато от списъка с изображения.',
      detail: image.title || image.category || image.url,
      onConfirm: async () => {
        setError('');
        try {
          await adminService.deleteImage(image.id);
          const [overviewData, imageData] = await Promise.all([
            adminService.overview(),
            adminService.images(),
          ]);
          setOverview(overviewData);
          setImages(imageData);
        } catch (err) {
          setError(String(err));
        }
      },
    });
  };

  return (
    <section className="section">
      <div className="container stack-lg">
        <BackLink to="/spaces">Назад към моите места</BackLink>

        <div className="page-header">
          <div>
            <span className="eyebrow">Управление</span>
            <h1>Управление на системата</h1>
            <p className="muted">Потребители, пространства, места и изображения.</p>
          </div>
        </div>

        <div className="stats-row">
          {overview && Object.entries(overview).map(([key, value]) => (
            <div className="stat-card glass-card" key={key}>
              <strong>{value}</strong>
              <span>{overviewLabels[key] || key}</span>
            </div>
          ))}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="studio-grid admin-grid">
          <div className="glass-card editor-card stack-md">
            <div className="sidebar-title-row">
              <h3>Потребители</h3>
              {loading && <span className="chip">...</span>}
            </div>

            <div className="admin-users-list">
              {users.map((user) => (
                <div className={`content-item admin-user-item ${user.id === selectedUserId ? 'selected' : ''}`} key={user.id}>
                  <button className="admin-user-select" type="button" onClick={() => selectUser(user)}>
                    <strong>{user.username}</strong>
                    <span>{user.email}</span>
                    <span className="chip">
                      {user.role === 'admin'
                        ? roleLabel(user.role)
                        : countLabel(user.Spaces?.length || 0, 'пространство', 'пространства')}
                    </span>
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={user.role === 'admin'}
                    onClick={() => removeUser(user)}
                  >
                    Изтриване
                  </button>
                </div>
              ))}
              {!loading && users.length === 0 && <div className="empty-panel">Няма потребители.</div>}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Нов потребител</h4>
              <form className="stack-sm" onSubmit={createUser}>
                <div className="input-grid">
                  <label>
                    Потребителско име
                    <input
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      minLength={3}
                      maxLength={30}
                      required
                    />
                  </label>
                  <label>
                    Електронна поща
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Парола
                    <input
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      minLength={6}
                      required
                    />
                  </label>
                </div>
                <button className="btn btn-primary">Създай потребител</button>
              </form>
            </div>
          </div>

          <div className="glass-card editor-card stack-md">
            <div className="sidebar-title-row">
              <h3>Данни за профила</h3>
              {selectedUser && <span className="chip">{roleLabel(selectedUser.role)}</span>}
            </div>

            {selectedUser ? (
              <>
                <form className="stack-sm" onSubmit={saveUser}>
                  <div className="input-grid">
                    <label>
                      Име
                      <input
                        value={userDraft.username}
                        onChange={(event) => setUserDraft({ ...userDraft, username: event.target.value })}
                        minLength={3}
                        maxLength={30}
                        required
                      />
                    </label>
                    <label>
                      Електронна поща
                      <input
                        value={userDraft.email}
                        onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })}
                        disabled={selectedUser.role === 'admin'}
                        type="email"
                        required
                      />
                    </label>
                  </div>
                  <button className="btn btn-primary">Запази потребителя</button>
                </form>

                <div className="admin-mini-stats">
                  <span className="chip">{countLabel(spaces.length, 'пространство', 'пространства')}</span>
                  <span className="chip">{countLabel(selectedLocationCount, 'място', 'места')}</span>
                </div>

                {detailError && <div className="form-error">{detailError}</div>}
                {detailLoading ? <div className="empty-panel">Зареждане...</div> : (
                  <div className="admin-space-list">
                    {spaces.map((space) => (
                      <article className="admin-space-card" key={space.id}>
                        <form className="stack-sm" onSubmit={(event) => saveSpace(event, space.id)}>
                          <div className="input-grid">
                            <label>
                              Пространство
                              <input
                                value={spaceDrafts[space.id]?.title || ''}
                                onChange={(event) => setSpaceDrafts({
                                  ...spaceDrafts,
                                  [space.id]: { ...spaceDrafts[space.id], title: event.target.value },
                                })}
                                required
                              />
                            </label>
                            <label>
                              Корица
                              <input
                                value={spaceDrafts[space.id]?.coverImage || ''}
                                onChange={(event) => setSpaceDrafts({
                                  ...spaceDrafts,
                                  [space.id]: { ...spaceDrafts[space.id], coverImage: event.target.value },
                                })}
                              />
                            </label>
                          </div>
                          <label>
                            Описание
                            <textarea
                              value={spaceDrafts[space.id]?.description || ''}
                              onChange={(event) => setSpaceDrafts({
                                ...spaceDrafts,
                                [space.id]: { ...spaceDrafts[space.id], description: event.target.value },
                              })}
                              rows={2}
                            />
                          </label>
                          <div className="space-card-actions">
                            <button className="btn btn-secondary">Запази пространство</button>
                            <button className="btn btn-danger" type="button" onClick={() => removeSpace(space)}>Изтриване на пространство</button>
                          </div>
                        </form>

                        <div className="admin-location-list">
                          {(space.Locations || []).map((location) => (
                            <div className="admin-space-card" key={location.id}>
                            <form className="admin-location-row" onSubmit={(event) => saveLocation(event, location.id)}>
                              <label>
                                Място
                                <input
                                  value={locationDrafts[location.id]?.title || ''}
                                  onChange={(event) => setLocationDrafts({
                                    ...locationDrafts,
                                    [location.id]: { ...locationDrafts[location.id], title: event.target.value },
                                  })}
                                  required
                                />
                              </label>
                              <label>
                                Ред
                                <input
                                  type="number"
                                  min="0"
                                  value={locationDrafts[location.id]?.order ?? 0}
                                  onChange={(event) => setLocationDrafts({
                                    ...locationDrafts,
                                    [location.id]: { ...locationDrafts[location.id], order: event.target.value },
                                  })}
                                />
                              </label>
                              <label>
                                Снимка
                                <input
                                  value={locationDrafts[location.id]?.image || ''}
                                  onChange={(event) => setLocationDrafts({
                                    ...locationDrafts,
                                    [location.id]: { ...locationDrafts[location.id], image: event.target.value },
                                  })}
                                />
                              </label>
                              <div className="admin-row-actions">
                                <button className="btn btn-secondary">Запази</button>
                                <button className="btn btn-danger" type="button" onClick={() => removeLocation(location)}>Изтриване</button>
                              </div>
                            </form>
                            <div className="stack-sm">
                              <strong>Учебно съдържание</strong>
                              {(location.Contents || []).map((content) => (
                                <form className="admin-location-row" key={content.id} onSubmit={(event) => saveContent(event, content.id)}>
                                  <label>
                                    Вид
                                    <select
                                      value={contentDrafts[content.id]?.type || 'text'}
                                      onChange={(event) => setContentDrafts({
                                        ...contentDrafts,
                                        [content.id]: { ...contentDrafts[content.id], type: event.target.value },
                                      })}
                                    >
                                      <option value="text">Текст</option>
                                      <option value="formula">Формула</option>
                                      <option value="image">Изображение</option>
                                    </select>
                                  </label>
                                  <label>
                                    Съдържание
                                    <textarea
                                      rows="2"
                                      value={contentDrafts[content.id]?.value || ''}
                                      onChange={(event) => setContentDrafts({
                                        ...contentDrafts,
                                        [content.id]: { ...contentDrafts[content.id], value: event.target.value },
                                      })}
                                    />
                                  </label>
                                  <div className="admin-row-actions">
                                    <button className="btn btn-secondary">Запази</button>
                                    <button className="btn btn-danger" type="button" onClick={() => removeContent(content)}>Изтриване</button>
                                  </div>
                                </form>
                              ))}
                              {(location.Contents || []).length === 0 && <p className="muted">Няма учебно съдържание.</p>}
                            </div>
                            </div>
                          ))}
                          {(space.Locations || []).length === 0 && <p className="muted">Няма места.</p>}
                        </div>
                      </article>
                    ))}
                    {spaces.length === 0 && <div className="empty-panel">Няма пространства за този потребител.</div>}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-panel">Нужен е избран потребител.</div>
            )}
          </div>
        </div>

        <div className="glass-card editor-card stack-md">
          <h3>Готови изображения</h3>
          <form className="stack-sm" onSubmit={addImage}>
            <div className="input-grid">
              <label>
                Адрес на изображението
                <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} required />
              </label>
              <label>
                Категория
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </label>
            </div>
            <button className="btn btn-primary">Добавяне на изображение</button>
          </form>
          <div className="image-admin-grid">
            {images.map((image) => (
              <div className="image-admin-card" key={image.id}>
                <img src={image.url} alt={image.title || image.category || 'изображение'} />
                <div className="space-card-actions compact-actions">
                  {image.title && <strong>{image.title}</strong>}
                  <span className="chip">{image.category || 'без категория'}</span>
                  <button className="btn btn-danger" onClick={() => removeImage(image)}>Изтриване</button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
