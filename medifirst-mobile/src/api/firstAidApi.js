import api from './axiosConfig';

export const getAllGuides = async (params = {}) => {
  const response = await api.get('/first-aid', { params });
  return response.data;
};

export const getGuideById = async (id) => {
  const response = await api.get(`/first-aid/${id}`);
  return response.data;
};

export const getGuidesByCategory = async (category) => {
  const response = await api.get(`/first-aid/category/${category}`);
  return response.data;
};

export const searchGuides = async (query) => {
  const response = await api.get('/first-aid', { params: { search: query } });
  return response.data;
};
