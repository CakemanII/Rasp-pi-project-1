from flask import Flask, send_file, request, jsonify
from pathlib import Path
from game import ColorGame
import threading
import time

app = Flask(__name__)

# Initialize the game
game = ColorGame(initial_lives=3, initial_time=30.0)

# Time tracking
game_active = False
time_thread = None

def update_time_continuously():
    """Background thread that continuously updates game time"""
    global game_active
    while game_active:
        time.sleep(0.1)  # Update every 100ms
        game.elapseTime(0.1)
        if game.isGameOver():
            game_active = False

# absolute or relative path to your HTML file
html_path = Path("../webapp/index.html")

@app.route("/")
def home():
    return send_file(html_path)


@app.route("/api/start", methods=["POST"])
def start_game():
    """Start a new game"""
    global game_active, time_thread
    
    game.startGame()
    
    # Start time tracking thread if not already running
    if not game_active:
        game_active = True
        time_thread = threading.Thread(target=update_time_continuously, daemon=True)
        time_thread.start()
    
    return jsonify({
        "success": True
    })


@app.route("/api/colors")
def get_colors():
    """Get the current inputted colors"""
    return jsonify({
        "inputted_colors": game._correctColors
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