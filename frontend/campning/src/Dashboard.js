import React, { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import "./App.css";

function Dashboard() {
  const [file, setFile] = useState(null);
  const [graphs, setGraphs] = useState({});
  const [kpis, setKpis] = useState({});
  const [insights, setInsights] = useState([]);
  const [chat, setChat] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const username = localStorage.getItem("username") || "User";

  // Upload CSV
  const uploadFile = async () => {
    if (!file) { alert("Please select a CSV file"); return; }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:5000/upload", formData);
      setGraphs(res.data.graphs || {});
      setKpis(res.data.kpis || {});
      setInsights(res.data.insights || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
      setLoading(false);
    }
  };

  // Download CSV
  const downloadReport = async () => {
    if (!file) { alert("Please upload a CSV first"); return; }
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("http://127.0.0.1:5000/download", formData, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'processed_report.csv');
    document.body.appendChild(link);
    link.click();
  };

  // Chatbot query
  const sendQuery = async () => {
    if (!query) return;
    setChat(prev => [...prev, { user: query, bot: null }]);
    const res = await axios.post("http://127.0.0.1:5000/chatbot", { query });
    setChat(prev => {
      const newChat = [...prev];
      newChat[newChat.length - 1].bot = res.data.response;
      return newChat;
    });
    setQuery("");
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("username");
    window.location.reload();
  };

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28"];

  return (
    <div className="container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Welcome, {username} to CampaignIQ 🚀</h1>
        <div className="profile" onClick={() => setShowProfile(!showProfile)}>
          <img src={`https://ui-avatars.com/api/?name=${username}`} alt="Profile" />
          {showProfile && (
            <div className="profile-dropdown">
              <span>{username}</span>
              <button onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-box">
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={uploadFile}>{loading ? "Uploading..." : "Generate Report"}</button>
        <button onClick={downloadReport}>Download Report</button>
      </div>

      {/* KPI Cards */}
      {Object.keys(kpis).length > 0 && (
        <div className="kpi-container">
          <div className="kpi-card"><h3>Total Spend</h3><p>₹ {kpis.total_spend}</p></div>
          <div className="kpi-card"><h3>Total Revenue</h3><p>₹ {kpis.total_revenue}</p></div>
          <div className="kpi-card"><h3>Avg CTR</h3><p>{kpis.avg_ctr?.toFixed(3)}</p></div>
          <div className="kpi-card"><h3>Avg ROAS</h3><p>{kpis.avg_roas?.toFixed(2)}</p></div>
        </div>
      )}

      {/* Charts */}
      <div className="charts">
        {graphs.revenue_by_campaign?.length > 0 && (
          <div className="chart-card">
            <h3>Revenue by Campaign</h3>
            <BarChart width={400} height={300} data={graphs.revenue_by_campaign}>
              <XAxis dataKey="campaign_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#4CAF50" />
            </BarChart>
          </div>
        )}

        {graphs.spend_trend?.length > 0 && (
          <div className="chart-card">
            <h3>Spend Trend</h3>
            <LineChart width={400} height={300} data={graphs.spend_trend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ad_spend" stroke="#2196F3" />
            </LineChart>
          </div>
        )}

        {graphs.platform_dist?.length > 0 && (
          <div className="chart-card">
            <h3>Platform Distribution</h3>
            <PieChart width={300} height={300}>
              <Pie
                data={graphs.platform_dist}
                dataKey="revenue"
                nameKey="platform"
                outerRadius={100}
                label
              >
                {graphs.platform_dist.map((entry, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="insights">
        <h2>📊 Insights</h2>
        {insights.length > 0 ? <ul>{insights.map((i, idx) => <li key={idx}>{i}</li>)}</ul> : <p>No insights available</p>}
      </div>

      {/* Floating AI Logo */}
      <div className="ai-chatbot-container">
        {/* Logo toggles chat */}
        <img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712840.png"
          alt="AI Chatbot"
          className="ai-chatbot-logo"
          onClick={() => setChatOpen(!chatOpen)}
        />

        {/* Chat window */}
        {chatOpen && (
          <div className="chatbot" onClick={(e) => e.stopPropagation()}>
            <div className="chat-window">
              {chat.map((c, idx) => (
                <div key={idx}>
                  <p><strong>You:</strong> {c.user}</p>
                  {c.bot && <p><strong>Bot:</strong> {c.bot}</p>}
                </div>
              ))}
            </div>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask me about CTR, ROI, Reports..."
            />
            <button onClick={sendQuery}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;