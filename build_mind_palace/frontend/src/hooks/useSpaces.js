import { useEffect, useState } from 'react';
import { spaceService } from '../services/space.service';

export function useSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSpaces = async () => {
    setLoading(true);
    setError('');
    try {
      setSpaces(await spaceService.getAll());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpaces();
  }, []);

  const createSpace = async (data) => {
    setError('');
    const created = await spaceService.create(data);
    setSpaces((current) => [created, ...current]);
    return created;
  };

  const deleteSpace = async (id) => {
    setError('');
    await spaceService.delete(id);
    setSpaces((current) => current.filter((space) => space.id !== id));
  };

  return { spaces, loading, error, createSpace, deleteSpace, reloadSpaces: loadSpaces };
}

export function useSpace(id) {
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadSpace = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await spaceService.getOne(id);
        if (active) {
          setSpace(data);
        }
      } catch (err) {
        if (active) {
          setSpace(null);
          setError(String(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSpace();

    return () => {
      active = false;
    };
  }, [id]);

  return { space, loading, error, setSpace };
}
