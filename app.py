"""
CoolWatch – Beverage Cooling Time Predictor
Backend: Flask + Python standard library (math module)
Uses Newton's Law of Cooling to predict when a beverage
reaches a desired serving temperature.
"""

from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)


def validate_inputs(T0, Ts, T1, t1, T_target):
    """
    Validate all five inputs and return a descriptive error message
    if anything is wrong.  Returns None when all inputs are valid.
    """
    # --- basic ordering constraints required by Newton's Law of Cooling ---
    if not (Ts < T1 < T0):
        return (
            "Temperature order is invalid. "
            "Room temperature must be less than the observed temperature, "
            "and the observed temperature must be less than the initial temperature "
            f"(required: Ts < T1 < T0, got: {Ts} < {T1} < {T0})."
        )

    if not (Ts < T_target < T0):
        return (
            "Target temperature is out of range. "
            "It must be greater than the room temperature and less than the "
            f"initial temperature (required: {Ts} < target < {T0}, got: {T_target})."
        )

    if t1 <= 0:
        return "Observation time must be a positive number (greater than 0 minutes)."

    return None  # all good


@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")


@app.route("/calculate", methods=["POST"])
def calculate():
    """
    Receive JSON with the five input values, run the Newton's Law of Cooling
    calculation, and return results (or an error message) as JSON.
    """
    data = request.get_json()

    # --- parse inputs ---
    try:
        T0       = float(data["T0"])       # initial temperature
        Ts       = float(data["Ts"])       # surrounding / room temperature
        T1       = float(data["T1"])       # observed temperature at time t1
        t1       = float(data["t1"])       # observation time (minutes)
        T_target = float(data["T_target"]) # desired serving temperature
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "All five fields must be filled in with valid numbers."}), 400

    # --- validate ---
    error = validate_inputs(T0, Ts, T1, t1, T_target)
    if error:
        return jsonify({"error": error}), 400

    # --- calculate cooling constant k ---
    # k = -ln((T1 - Ts) / (T0 - Ts)) / t1
    ratio_observed = (T1 - Ts) / (T0 - Ts)
    k = -math.log(ratio_observed) / t1

    if k <= 0:
        return jsonify({"error": "Calculated cooling constant k is not positive. "
                                 "Please check your input values."}), 400

    # --- calculate estimated time to reach target temperature ---
    # t = -ln((T_target - Ts) / (T0 - Ts)) / k
    ratio_target = (T_target - Ts) / (T0 - Ts)
    t_estimated  = -math.log(ratio_target) / k

    # --- build the cooling curve data points (every 0.5 minutes up to 1.5× t_estimated) ---
    t_max      = max(t_estimated * 1.5, t1 * 2, 10)  # at least 10 minutes of chart
    num_points = 80
    step       = t_max / num_points

    chart_times  = []
    chart_temps  = []
    for i in range(num_points + 1):
        t_val = i * step
        T_val = Ts + (T0 - Ts) * math.exp(-k * t_val)
        chart_times.append(round(t_val, 3))
        chart_temps.append(round(T_val, 3))

    # --- format the estimated time as hours + minutes ---
    total_minutes = t_estimated
    hours         = int(total_minutes // 60)
    minutes_rem   = total_minutes % 60

    if hours > 0:
        time_display = f"{hours} hr {minutes_rem:.1f} min"
    else:
        time_display = f"{total_minutes:.2f} min"

    return jsonify({
        "k":             round(k, 6),
        "t_estimated":   round(t_estimated, 2),
        "time_display":  time_display,
        "chart_times":   chart_times,
        "chart_temps":   chart_temps,
        "T0":            T0,
        "Ts":            Ts,
        "T1":            T1,
        "t1":            t1,
        "T_target":      T_target,
    })


if __name__ == "__main__":
    # debug=True gives helpful error pages during development
    app.run(debug=True)
