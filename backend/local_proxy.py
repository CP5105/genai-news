import os
from urllib import error as urllib_error
from urllib import request as urllib_request

from fastapi import FastAPI, HTTPException, Request, Response

UPSTREAM_BACKEND_URL = os.getenv("UPSTREAM_BACKEND_URL", "http://127.0.0.1:8001").rstrip(
    "/"
)
PROXY_PREFIX = "/api"

app = FastAPI(
    title="GenAI News Local Proxy",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


def _upstream_url(path: str, query: str) -> str:
    upstream_path = "/" if not path else f"/{path}"
    url = f"{UPSTREAM_BACKEND_URL}{upstream_path}"
    if query:
        return f"{url}?{query}"
    return url


def _proxy_get(upstream_url: str) -> Response:
    request = urllib_request.Request(upstream_url, method="GET")
    try:
        with urllib_request.urlopen(request, timeout=30) as upstream_response:
            return Response(
                content=upstream_response.read(),
                status_code=upstream_response.getcode(),
                headers={
                    "content-type": upstream_response.headers.get(
                        "Content-Type", "application/json"
                    )
                },
            )
    except urllib_error.HTTPError as exc:
        return Response(
            content=exc.read(),
            status_code=exc.code,
            headers={"content-type": exc.headers.get("Content-Type", "application/json")},
        )
    except urllib_error.URLError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream backend unavailable: {exc.reason}",
        ) from exc


@app.get("/")
def root():
    return {
        "service": "GenAI News local proxy",
        "prefix": PROXY_PREFIX,
        "upstream": UPSTREAM_BACKEND_URL,
    }


@app.get("/health")
def health():
    return {"status": "ok", "upstream": UPSTREAM_BACKEND_URL}


@app.get("/api", include_in_schema=False)
@app.get(
    "/api/{path:path}",
    include_in_schema=False,
)
def proxy_api(request: Request, path: str = ""):
    upstream_url = _upstream_url(path, request.url.query)
    return _proxy_get(upstream_url)
