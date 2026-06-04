import http.server
import socketserver
import sys

PORT = 8082

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/log':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            print("BROWSER LOG:", post_data.decode('utf-8'))
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Serving at port", PORT)
    httpd.serve_forever()
