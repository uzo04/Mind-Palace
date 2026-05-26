# Mind Palace Frontend

Frontend частта е изградена с React 19 и Vite.

## Setup

```bash
npm install
npm run dev
```

Работи на `http://localhost:3000`.

## Env

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=
```

## Notes

- JWT токенът се чете от `localStorage` ключ `token`
- Vite proxy подава `/auth`, `/spaces`, `/locations`, `/content`, `/progress`, `/stock-images`, `/admin`, `/sync`, `/uploads` и `/health` към backend-а при локална разработка
