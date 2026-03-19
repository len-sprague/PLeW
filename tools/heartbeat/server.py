"""
Lightweight local server for viewing HTML visualizations.

- Serves static files from its own directory.
- Injects a small heartbeat script into HTML responses.
- Automatically shuts down when the browser tab is closed
  (no heartbeat received for TIMEOUT seconds).

No external dependencies — uses only the Python 3 standard library.
"""

import http.server
import os
import sys
import threading
import time

# =============================================================
# Configuration
# =============================================================
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
TIMEOUT = 10  # seconds without a heartbeat before shutdown

# =============================================================
# Heartbeat tracking
# =============================================================
last_heartbeat = time.time()
lock = threading.Lock()

HEARTBEAT_SCRIPT = b"""
<script>
(function() {
    var hbInterval = setInterval(function() {
        fetch('/___heartbeat').catch(function() { clearInterval(hbInterval); });
    }, 3000);
    window.addEventListener('beforeunload', function() {
        navigator.sendBeacon('/___shutdown');
    });
})();
</script>
"""


class Handler(http.server.SimpleHTTPRequestHandler):
    """Extends the standard static file server with heartbeat endpoints."""

    def do_GET(self):
        if self.path == '/___heartbeat':
            with lock:
                global last_heartbeat
                last_heartbeat = time.time()
            self.send_response(204)
            self.end_headers()
            return

        # For HTML files, intercept the response to inject the heartbeat script
        if self.path.endswith('.html') or self.path.endswith('.htm') or self.path == '/':
            return self._serve_html_with_heartbeat()

        return super().do_GET()

    def do_POST(self):
        if self.path == '/___shutdown':
            self.send_response(204)
            self.end_headers()
            # Give the response a moment to flush, then shut down
            threading.Timer(0.5, _shutdown).start()
            return
        self.send_error(405)

    def _serve_html_with_heartbeat(self):
        """Serve an HTML file with the heartbeat script injected before </body>."""
        path = self.translate_path(self.path)
        try:
            with open(path, 'rb') as f:
                content = f.read()
        except (FileNotFoundError, IsADirectoryError):
            self.send_error(404)
            return

        # Inject before </body> if present, otherwise append
        lower = content.lower()
        idx = lower.rfind(b'</body>')
        if idx != -1:
            content = content[:idx] + HEARTBEAT_SCRIPT + content[idx:]
        else:
            content += HEARTBEAT_SCRIPT

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        """Suppress heartbeat noise in the console."""
        if '/___heartbeat' not in str(args):
            super().log_message(format, *args)


def _shutdown():
    print("\nBrowser tab closed. Shutting down server.")
    os._exit(0)


def watchdog():
    """Background thread that shuts down the server if heartbeats stop."""
    # Grace period: don't check until the page has had time to load
    time.sleep(TIMEOUT)
    while True:
        time.sleep(3)
        with lock:
            elapsed = time.time() - last_heartbeat
        if elapsed > TIMEOUT:
            _shutdown()


# =============================================================
# Start
# =============================================================
if __name__ == '__main__':
    threading.Thread(target=watchdog, daemon=True).start()

    server = http.server.HTTPServer(('', PORT), Handler)
    print(f"Serving on http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
