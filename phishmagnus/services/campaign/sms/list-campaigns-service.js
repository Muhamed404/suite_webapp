const axios = require("axios");
const API_BASE = process.env.BACKEND_API_URL + "/sms-campaign";

module.exports = async function listCampaigns() {
  const res = await axios.get(`${API_BASE}/list`);
  return res.data;
};