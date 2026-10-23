# CoolWatch – Beverage Cooling Time Predictor

A beginner-friendly college project that predicts how long a hot beverage takes
to cool to a desired serving temperature using **Newton's Law of Cooling**.

---

## Project Structure

```
CoolWatch/
├── app.py               ← Flask backend (all calculations here)
├── requirements.txt     ← Python dependencies
├── README.md            ← This file
├── templates/
│   └── index.html       ← Main web page (Jinja2 template)
└── static/
    ├── style.css        ← Custom styles (Bootstrap 5 + overrides)
    └── script.js        ← Chart.js graph + fetch API call
```

---

## The Maths – Newton's Law of Cooling

Given:
| Symbol    | Meaning                                       |
|-----------|-----------------------------------------------|
| T₀        | Initial beverage temperature                  |
| Tₛ        | Surrounding / room temperature                |
| T₁        | Observed temperature at time t₁               |
| t₁        | Time of observation (minutes)                 |
| T_target  | Desired serving temperature                   |

**Step 1 – Find the cooling constant k:**

```
k = -ln((T₁ - Tₛ) / (T₀ - Tₛ)) / t₁
```

**Step 2 – Find the time to reach the target:**

```
t = -ln((T_target - Tₛ) / (T₀ - Tₛ)) / k
```

**Temperature at any time t:**

```
T(t) = Tₛ + (T₀ - Tₛ) × e^(-k × t)
```

---

## Setup & Installation (Windows – VS Code / Kiro Terminal)

### 1. Prerequisites
- Python 3.9 or newer installed and added to PATH.
  Check with: `python --version`

### 2. (Recommended) Create a virtual environment

Open a terminal **inside the CoolWatch folder** and run:

```powershell
python -m venv venv
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

> If you see an execution policy error, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Then try activating again.

### 3. Install Flask

```powershell
pip install -r requirements.txt
```

### 4. Run the application

```powershell
python app.py
```

You should see output similar to:

```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### 5. Open the app

Open your browser and go to:

```
http://127.0.0.1:5000
```

---

## How to use

1. Enter the **initial beverage temperature** (e.g. 90 °C for freshly brewed coffee).
2. Enter the **room temperature** (e.g. 25 °C).
3. After waiting a few minutes, enter the **observed temperature** at that time.
4. Enter how many minutes you waited (**observation time**).
5. Enter the **target serving temperature** you'd like (e.g. 55 °C).
6. Click **Calculate**.
7. CoolWatch shows:
   - The calculated cooling constant **k**
   - Estimated time to reach the target (in minutes and hours/minutes)
   - The filled-in Newton's Law equation
   - A plain-English explanation of the result
   - A **Chart.js cooling curve** graph

Click **Reset** to clear everything and start over.

---

## Input Validation Rules

| Constraint                        | Reason                                          |
|-----------------------------------|-------------------------------------------------|
| Tₛ < T₁ < T₀                     | The beverage must be cooling toward room temp   |
| Tₛ < T_target < T₀               | Target must be reachable during the cool-down   |
| t₁ > 0                           | Time must be a positive number                  |
| k > 0 (derived automatically)    | Ensures physical cooling (not heating)          |

---

## Technologies Used

| Layer       | Technology                       |
|-------------|----------------------------------|
| Backend     | Python 3, Flask 3                |
| Maths       | Python `math` module (no extras) |
| Frontend    | HTML5, Bootstrap 5, CSS3         |
| Graph       | Chart.js 4                       |
| Icons       | Bootstrap Icons                  |
| Font        | Google Fonts – Inter             |

---

## Stopping the server

Press `Ctrl + C` in the terminal where `python app.py` is running.

To deactivate the virtual environment afterwards:

```powershell
deactivate
```

---

*CoolWatch – College Project | Based on Newton's Law of Cooling*
