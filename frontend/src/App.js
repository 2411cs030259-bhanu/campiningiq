import React, { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [graphs, setGraphs] = useState({});
  const [kpis, setKpis] = useState({});
  const [insights, setInsights] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:5000/upload", formData);

      console.log("Backend Data:", res.data); // DEBUG

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

  return (
    <div className="container">
      <h1 className="title">🚀 CampaignIQ Dashboard</h1>

      {/* Upload Section */}
      <div className="upload-box">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <button onClick={uploadFile} className="btn">
          {loading ? "Uploading..." : "Upload"}
        </button>

        <button
          onClick={() => setShowDashboard(true)}
          className="btn secondary"
          disabled={!graphs || Object.keys(graphs).length === 0}
        >
          Show Dashboard
        </button>
      </div>

      {/* Dashboard */}
      {showDashboard && (
        <div className="dashboard fade-in">

          {/* KPI CARDS */}
          <div className="kpi-container">
            <div className="kpi-card">
              <h3>Total Spend</h3>
              <p>₹ {kpis.total_spend || 0}</p>
            </div>

            <div className="kpi-card">
              <h3>Total Revenue</h3>
              <p>₹ {kpis.total_revenue || 0}</p>
            </div>

            <div className="kpi-card">
              <h3>Avg CTR</h3>
              <p>{kpis.avg_ctr?.toFixed(3) || 0}</p>
            </div>

            <div className="kpi-card">
              <h3>Avg ROAS</h3>
              <p>{kpis.avg_roas?.toFixed(2) || 0}</p>
            </div>
          </div>

          {/* CHARTS */}
          <div className="charts">

            {/* Revenue by Campaign */}
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

            {/* Spend Trend */}
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

            {/* Platform Distribution */}
            {graphs.platform_dist?.length > 0 && (
              <div className="chart-card">
                <h3>Platform Distribution</h3>
                <PieChart width={300} height={300}>
                  <Pie
                    data={graphs.platform_dist}
                    dataKey="revenue"
                    nameKey="platform"
                    outerRadius={100}
                    fill="#8884d8"
                    label="platform"
                  >
                    {graphs.platform_dist.map((entry, index) => (
                      <Cell key={index} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
            )}

          </div>

          {/* INSIGHTS */}
          <div className="insights">
            <h2>📊 Insights</h2>
            {insights.length > 0 ? (
              <ul>
                {insights.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            ) : (
              <p>No insights available</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default App;