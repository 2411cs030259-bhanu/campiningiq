from flask import Flask, request, jsonify, send_file, session
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
app.secret_key = "supersecretkey"  # Needed for session tracking
CORS(app, supports_credentials=True)

# --- USER STORAGE ---
users = {}          # Stores username -> password
active_users = set()  # Tracks currently logged-in users

# --- SIGNUP ---
@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if username in users:
        return jsonify({"error": "User already exists"}), 400
    users[username] = password
    print(f"New user signed up: {username}")
    return jsonify({"message": "Signup successful"})

# --- LOGIN ---
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if users.get(username) == password:
        session["username"] = username
        active_users.add(username)
        print(f"User logged in: {username}")
        print(f"Active users: {list(active_users)}")
        return jsonify({"message": "Login successful", "username": username})
    return jsonify({"error": "Invalid credentials"}), 401

# --- LOGOUT ---
@app.route("/logout", methods=["POST"])
def logout():
    username = session.pop("username", None)
    if username and username in active_users:
        active_users.remove(username)
        print(f"User logged out: {username}")
        print(f"Active users: {list(active_users)}")
    return jsonify({"message": f"{username} logged out" if username else "No user logged in"})

# --- GET ACTIVE USERS ---
@app.route("/active_users", methods=["GET"])
def get_active_users():
    return jsonify({"active_users": list(active_users), "count": len(active_users)})

# --- DATA PROCESSING ---
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
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
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
    graphs["revenue_by_campaign"] = df.groupby("campaign_type")["revenue"].sum().reset_index().to_dict(orient="records") if "campaign_type" in df.columns else []
    graphs["spend_trend"] = df.groupby("date")["ad_spend"].sum().reset_index().to_dict(orient="records") if "date" in df.columns else []
    graphs["platform_dist"] = df.groupby("platform")["revenue"].sum().reset_index().to_dict(orient="records") if "platform" in df.columns else []
    insights = []
    if kpis["avg_roas"] < 1: insights.append("Campaigns are in loss")
    if kpis["avg_ctr"] < 0.05: insights.append("Low engagement")
    if not df.empty:
        best = df.loc[df["revenue"].idxmax()]
        insights.append(f"Best campaign: {best.get('campaign_type', 'Unknown')}")
    return df, {"kpis": kpis, "graphs": graphs, "insights": insights}

# --- FILE UPLOAD ---
@app.route('/upload', methods=['POST'])
def upload():
    try:
        file = request.files.get('file')
        df = pd.read_csv(file)
        _, result = process_data(df)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- FILE DOWNLOAD ---
@app.route('/download', methods=['POST'])
def download():
    file = request.files.get('file')
    df = pd.read_csv(file)
    processed_df, _ = process_data(df)
    processed_df.to_csv("processed_report.csv", index=False)
    return send_file("processed_report.csv", as_attachment=True)

# --- CHATBOT ---
@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.get_json()
    query = data.get("query", "").lower()
    response = "Sorry, I didn't understand that."
    if "ctr" in query: response = "CTR measures click-through rate. Improve ad creatives if low."
    elif "roi" in query or "roas" in query: response = "ROI/ROAS shows campaign profitability. Reduce spend on low-performing campaigns."
    elif "best campaign" in query: response = "Check the 'Best campaign' insight on your dashboard."
    elif "report" in query: response = "Use the 'Generate Report' or 'Download Report' button."
    print(f"Chatbot query: {query} -> Response: {response}")
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)