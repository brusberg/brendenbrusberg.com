# Receives data: URLs by POST and writes the decoded bytes into a directory.
# Local only, one job. The name comes from the URL path, so one receiver can
# take several files in a run: POST /train-atlas-art.png writes that name.
import base64, http.server, os, posixpath, sys

OUT_DIR = sys.argv[1]
DEFAULT = sys.argv[2] if len(sys.argv) > 2 else 'out.png'


class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')

    def _safe(self, default=None):
        # basename only: the path arrives from a browser and this both reads
        # and writes real files.
        return posixpath.basename(self.path.lstrip('/')) or default

    def do_GET(self):
        # The bake needs train-atlas.json, which no longer lives under public/
        # and so is not on the dev server. Serving it from here keeps the files
        # this reads and the files it writes in one directory.
        name = self._safe()
        path = os.path.join(OUT_DIR, name) if name else None
        if not path or not os.path.isfile(path):
            self.send_response(404)
            self._cors()
            self.end_headers()
            return
        with open(path, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json' if name.endswith('.json') else 'application/octet-stream')
        self.send_header('Content-Length', str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        # basename only: the path is attacker-shaped in principle, and this
        # writes real files.
        name = self._safe(DEFAULT)
        if not name.endswith('.png'):
            name += '.png'
        n = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(n).decode('utf-8', 'replace')
        b64 = body.split(',', 1)[1] if body.startswith('data:') else body
        data = base64.b64decode(b64)
        path = os.path.join(OUT_DIR, name)
        with open(path, 'wb') as f:
            f.write(data)
        self.send_response(200)
        self._cors()
        self.end_headers()
        self.wfile.write(b'ok %d' % len(data))
        print('wrote %d bytes to %s' % (len(data), path), flush=True)

    def log_message(self, *a):
        pass


http.server.HTTPServer(('127.0.0.1', 8800), H).serve_forever()
