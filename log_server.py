import http.server
import socketserver
import json
import os

PORT = 8081

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/log':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            print(f"BROWSER LOG: {post_data.decode('utf-8')}", flush=True)
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}", flush=True)
    httpd.serve_forever()
