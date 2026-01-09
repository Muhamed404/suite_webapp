const axios = require("axios");
const API_BASE = process.env.BACKEND_API_URL + "/sms-campaign";

module.exports = async function createCampaign(data) {
  const res = await axios.post(`${API_BASE}/create`, data);
  return res.data;
};