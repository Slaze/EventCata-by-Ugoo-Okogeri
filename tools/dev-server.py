#!/usr/bin/env python3
"""Local static server with the same SPA rewrites as vercel.json (/detail, /create, /e/:id)."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse


SPA_EXACT = {"/detail", "/create"}


class SpaHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urlparse(path)
        route = parsed.path.rstrip("/") or "/"
        if route in SPA_EXACT or route.startswith("/e/"):
            path = "/index.html"
        return super().translate_path(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8877)
    args = parser.parse_args()
    httpd = ThreadingHTTPServer((args.bind, args.port), SpaHandler)
    print(f"EventCata SPA server http://{args.bind}:{args.port}/", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
