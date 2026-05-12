from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.error
import ssl

TODOIST_URL = "https://api.todoist.com/api/v1/tasks"

# Use system cert store on Windows; fall back to unverified if unavailable
try:
    SSL_CTX = ssl.create_default_context()
    SSL_CTX.load_default_certs()
except Exception:
    SSL_CTX = ssl._create_unverified_context()

class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        auth = self.headers.get("Authorization", "")

        if self.path == "/proxy/tasks":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            req = urllib.request.Request(
                TODOIST_URL,
                data=body,
                headers={"Authorization": auth, "Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, context=SSL_CTX) as r:
                    resp = r.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(resp)
            except urllib.error.HTTPError as e:
                resp = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_response(502)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(str(e).encode())

        elif self.path.startswith("/proxy/tasks/") and self.path.endswith("/close"):
            task_id = self.path[len("/proxy/tasks/"):-len("/close")]
            url = f"https://api.todoist.com/api/v1/tasks/{task_id}/close"
            req = urllib.request.Request(url, data=b"", headers={"Authorization": auth}, method="POST")
            try:
                with urllib.request.urlopen(req, context=SSL_CTX):
                    pass
                self.send_response(204)
                self.end_headers()
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.end_headers()
            except Exception as e:
                self.send_response(502)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(str(e).encode())

        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == "/proxy/tasks":
            auth = self.headers.get("Authorization", "")
            req = urllib.request.Request(TODOIST_URL, headers={"Authorization": auth})
            try:
                with urllib.request.urlopen(req, context=SSL_CTX) as r:
                    body = r.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(body)
            except urllib.error.HTTPError as e:
                # Forward Todoist's actual status code so JS can report it
                body = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                msg = str(e).encode()
                self.send_response(502)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(msg)
        else:
            super().do_GET()

    def log_message(self, fmt, *args):
        pass

HTTPServer(("localhost", 8000), Handler).serve_forever()
