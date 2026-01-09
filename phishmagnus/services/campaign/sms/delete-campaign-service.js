const axios = require("axios");
const API_BASE = process.env.BACKEND_API_URL + "/sms-campaign";

module.exports = async function deleteCampaign(id) {
  const res = await axios.post(`${API_BASE}/${id}/delete`);
  return res.data;
};