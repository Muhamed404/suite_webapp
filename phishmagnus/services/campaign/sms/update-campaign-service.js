const axios = require("axios");
const API_BASE = process.env.BACKEND_API_URL + "/sms-campaign";

module.exports = async function updateCampaign(id, data) {
  const res = await axios.post(`${API_BASE}/${id}/update`, data);
  return res.data;
};