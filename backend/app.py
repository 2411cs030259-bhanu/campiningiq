from flask import Flask, request, jsonify, send_file, session
from flask_cors import CORS
import pandas as pd
import mysql.connector

app = Flask(__name__)
app.secret_key = "supersecretkey"
CORS(app, supports_credentials=True)

# -----------------------------
# MYSQL CONNECTION
# -----------------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",                 # change if needed
        password="123456",    # change this
        database="campningiq"
    )

# -----------------------------
# ACTIVE USERS (memory only)
# -----------------------------
active_users = set()

# -----------------------------
# SIGNUP
# -----------------------------
@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()

        user_id = data.get("id")
        username = data.get("username")
        password = data.get("password")

        conn = get_db_connection()
        cursor = conn.cursor()

        # check user exists
        cursor.execute(
            "SELECT * FROM users WHERE username=%s",
            (username,)
        )

        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "User already exists"}), 400

        # insert user (NOTE: passwoard spelling from your DB)
        cursor.execute(
            "INSERT INTO users(id, username, passwoard) VALUES(%s, %s, %s)",
            (user_id, username, password)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Signup successful"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# LOGIN
# -----------------------------
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        username = data.get("username")
        password = data.get("password")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE username=%s AND passwoard=%s",
            (username, password)
        )

        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            session["username"] = username
            active_users.add(username)

            return jsonify({
                "message": "Login successful",
                "username": username
            })

        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# LOGOUT
# -----------------------------
@app.route("/logout", methods=["POST"])
def logout():
    username = session.pop("username", None)

    if username and username in active_users:
        active_users.remove(username)

    return jsonify({
        "message": f"{username} logged out" if username else "No user logged in"
    })

# -----------------------------
# ACTIVE USERS
# -----------------------------
@app.route("/active_users", methods=["GET"])
def get_active_users():
    return jsonify({
        "active_users": list(active_users),
        "count": len(active_users)
    })

# -----------------------------
# DATA PROCESSING
# -----------------------------
def process_data(df):
    df.columns = df.columns.str.strip().str.lower()

    df.rename(columns={
        "campaign type": "campaign_type",
        "campaign": "campaign_type",
        "platform name": "platform",
        "channel": "platform",
        "channel_used": "platform",
        "date ": "date",
        "acquisition_cost": "ad_spend"
    }, inplace=True)

    df.fillna(0, inplace=True)

    required_cols = ["impressions", "clicks", "ad_spend", "conversions", "revenue"]

    for col in required_cols:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    df["ctr"] = df["clicks"] / df["impressions"].replace(0, 1)
    df["cpc"] = df["ad_spend"] / df["clicks"].replace(0, 1)
    df["cpa"] = df["ad_spend"] / df["conversions"].replace(0, 1)
    df["roas"] = df["revenue"] / df["ad_spend"].replace(0, 1)

    kpis = {
        "total_spend": float(df["ad_spend"].sum()),
        "total_revenue": float(df["revenue"].sum()),
        "avg_ctr": float(df["ctr"].mean()),
        "avg_roas": float(df["roas"].mean())
    }

    graphs = {}

    graphs["revenue_by_campaign"] = (
        df.groupby("campaign_type")["revenue"]
        .sum()
        .reset_index()
        .to_dict(orient="records")
        if "campaign_type" in df.columns else []
    )

    graphs["spend_trend"] = (
        df.groupby("date")["ad_spend"]
        .sum()
        .reset_index()
        .to_dict(orient="records")
        if "date" in df.columns else []
    )

    graphs["platform_dist"] = (
        df.groupby("platform")["revenue"]
        .sum()
        .reset_index()
        .to_dict(orient="records")
        if "platform" in df.columns else []
    )

    insights = []

    if kpis["avg_roas"] < 1:
        insights.append("Campaigns are in loss")

    if kpis["avg_ctr"] < 0.05:
        insights.append("Low engagement")

    if not df.empty:
        best = df.loc[df["revenue"].idxmax()]
        insights.append(
            f"Best campaign: {best.get('campaign_type', 'Unknown')}"
        )

    return df, {
        "kpis": kpis,
        "graphs": graphs,
        "insights": insights
    }

# -----------------------------
# UPLOAD
# -----------------------------
@app.route("/upload", methods=["POST"])
def upload():
    try:
        file = request.files.get("file")
        df = pd.read_csv(file)
        _, result = process_data(df)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# -----------------------------
# DOWNLOAD
# -----------------------------
@app.route("/download", methods=["POST"])
def download():
    try:
        file = request.files.get("file")
        df = pd.read_csv(file)
        processed_df, _ = process_data(df)

        processed_df.to_csv("processed_report.csv", index=False)

        return send_file("processed_report.csv", as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# -----------------------------
# CHATBOT
# -----------------------------
@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.get_json()
    query = data.get("query", "").lower()

    response = "Sorry, I didn't understand that."

    if "ctr" in query:
        response = "CTR measures click-through rate. Improve creatives."

    elif "roas" in query or "roi" in query:
        response = "ROAS shows profit. Reduce low-performing ads."

    elif "best campaign" in query:
        response = "Check dashboard insights for best campaign."

    elif "report" in query:
        response = "Use download option to get report."

    return jsonify({"response": response})

# -----------------------------
# RUN APP
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)