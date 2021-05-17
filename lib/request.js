const axios = require('axios');

axios.interceptors.response.use(response => response.data);

module.exports = {
  axios
}