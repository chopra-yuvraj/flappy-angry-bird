import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_folder='static', static_url_path='/static')


@app.route('/')
def index():
    """Landing page with animated hero section."""
    return render_template('index.html')


@app.route('/play')
def play():
    """Game page that embeds the Pygbag WASM build in an iframe."""
    return render_template('play.html')


@app.route('/game/')
def game():
    """Serve the Pygame WebAssembly build entry point."""
    return send_from_directory(
        os.path.join(app.static_folder, 'game'), 'index.html'
    )


@app.route('/game/<path:filename>')
def serve_game_files(filename):
    """Serve game assets (JS, CSS, WASM, data)."""
    return send_from_directory(
        os.path.join(app.static_folder, 'game'), filename
    )


@app.after_request
def add_header(response):
    """Add COOP/COEP headers required for SharedArrayBuffer (WASM threads)."""
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    return response


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
