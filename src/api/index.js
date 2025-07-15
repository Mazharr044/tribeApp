import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://dummy-chat-server.tribechat.com/api',
  timeout: 5000,
});

export default apiClient;
