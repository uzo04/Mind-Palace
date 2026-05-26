# Mind Palace

Уеб приложение за визуално асоциативно учене с `React + Vite` frontend и `Node.js + Express + MySQL` backend.

## Локално стартиране

1. Копирай `backend/.env.example` като `backend/.env`
2. Копирай `frontend/.env.example` като `frontend/.env`
3. Инсталирай зависимостите:

```bash
npm run install:all
```

4. Стартирай двете части:

```bash
npm run dev:backend
npm run dev:frontend
```

## Production / Hosting

Проектът е подготвен да работи като един production service:

- `frontend` се build-ва до `frontend/dist`
- `backend` сервира build-натия frontend
- има готов `Dockerfile` за Railway, Render или VPS
- upload-ите поддържат `local` и `cloudinary` режим

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

## Важни env променливи

```env
PORT=5000
DB_NAME=braingrowdb
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
JWT_SECRET=your_secret
DB_SYNC_MODE=safe
CORS_ORIGIN=https://your-domain.com
PUBLIC_APP_URL=https://your-domain.com
UPLOAD_PROVIDER=cloudinary
```

При `UPLOAD_PROVIDER=cloudinary` добави и:

```env
CLOUD_NAME=...
CLOUD_API_KEY=...
CLOUD_API_SECRET=...
CLOUDINARY_FOLDER=mind-palace
```
