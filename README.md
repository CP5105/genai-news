# GenAI News

## Environment Files

Backend:

- Use `.env.example` as the template for `.env`
- Required values:

```env
MONGO_URI=<MongoDB Atlas connection string>
MONGO_DATABASE=<database for stories shown in the product>
MONGO_COLLECTION=<collection for stories shown in the product>
```

Frontend:

- Use `frontend/.env.local.example` as the template for `frontend/.env.local`
- Required values:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SERVER_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_SITE_URL` is the frontend site's own public URL. `SERVER_API_URL`
is the API base URL used by server-side fetches and Next.js rewrites.

## Local Development

The frontend runs on `http://localhost:3000`. In local development, a small
proxy on `http://localhost:8000` forwards `/api/*` GET requests to the backend
running on `http://localhost:8001`.

### Start Order

1. Install backend dependencies and start the API on port `8001`:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

2. Start the local proxy on port `8000`:

```bash
cd backend
uvicorn local_proxy:app --reload --host 0.0.0.0 --port 8000
```

3. Install frontend dependencies and start Next.js:

```bash
cd frontend
npm install
npm run dev
```

4. Open `http://localhost:3000`.

## Deployment

The frontend expects API requests under `/api/*`.

If you deploy this app behind DigitalOcean routing rules, Nginx, Caddy, or any
other reverse proxy, configure that layer to rewrite `/api/*` to the backend's
actual routes by stripping the `/api` prefix.

Examples:

- `/api/stories` -> `/stories`
- `/api/story/{id}` -> `/story/{id}`

`SERVER_API_URL` should point to the API entrypoint without a trailing `/api`,
because the frontend already appends `/api/*` in its rewrites.

In production you need:

- Backend env: `MONGO_URI`, `MONGO_DATABASE`, `MONGO_COLLECTION`
- Frontend env: `NEXT_PUBLIC_SITE_URL`, `SERVER_API_URL`
