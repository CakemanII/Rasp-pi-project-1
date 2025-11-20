from flask import Flask, send_file, request, jsonify
from pathlib import Path
from game import ColorGame
import threading
import time
import os

app = Flask(__name__, static_folder="../webapp", static_url_path="/")

# Initialize the game
game = ColorGame(initial_lives=3, initial_time=30.0)

# Time tracking
game_active = False
time_thread = None

# absolute or relative path to your HTML file
html_path = Path("../webapp/index.html")

@app.route("/")
def home():
    return send_file(os.path.join(app.static_folder, "index.html"))


@app.route("/api/start", methods=["POST"])
def start_game():
    """Start a new game"""
    global game_active, time_thread
    
    game.startGame()
    
    return jsonify({
        "success": True
    })


@app.route("/api/colors")
def get_colors():
    """Get the current inputted colors"""
    return jsonify({
        "inputted_colors": game["inputted_colors"]
    })


@app.route("/api/input", methods=["POST"])
def input_color():
    """Submit color input"""
    # Get data from JSON body
    data = request.get_json()
    if not data or "color" not in data:
        return jsonify({"error": "No colors provided"}), 400
    
    # Get selected color
    selected_color = data["color"]
    
    # Input into the color game 
    game.colorInput(selected_color)


@app.route("/api/status")
def get_status():
    """Get current game status"""
    data = game.getData()

    return jsonify({
        "round": data["round"],
        "lives": data["lives"],
        "is_game_over": game.isGameOver(),
        "is_round_complete": game.isRoundComplete()
    })


@app.route("/api/time")
def get_time_remaining():
    data = game.getData()
    return jsonify({
        "time_remaining": data["time_remaining"]
    })

if __name__ == "__main__":
    app.run(debug=True)