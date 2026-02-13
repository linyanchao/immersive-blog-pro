import os
from pathlib import Path
from urllib.parse import urlparse, unquote
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

PORT = int(os.environ.get("PORT", "5173"))
ROOT = Path(__file__).resolve().parent.parent

class SPARequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        parsed = urlparse(self.path)
        req_path = unquote(parsed.path)
        if req_path.endswith(".html") or req_path == "/" or "." not in Path(req_path).name:
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        req_path = unquote(parsed.path)

        target = (ROOT / req_path.lstrip("/")).resolve()

        if ROOT not in target.parents and target != ROOT:
            self.send_error(403, "Forbidden")
            return

        if target.exists() and target.is_file():
            return super().do_GET()

        if target.exists() and target.is_dir():
            idx = target / "index.html"
            if idx.exists():
                self.path = req_path.rstrip("/") + "/index.html"
                return super().do_GET()

        # SPA fallback for history routes
        if "." not in Path(req_path).name:
            self.path = "/index.html"
            return super().do_GET()

        return super().do_GET()

if __name__ == "__main__":
    os.chdir(ROOT)
    with TCPServer(("127.0.0.1", PORT), SPARequestHandler) as httpd:
        print(f"Serving at http://127.0.0.1:{PORT}")
        httpd.serve_forever()