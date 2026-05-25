/**
 * adminTrainingService.js — Admin-facing training management API calls
 */

import api from './api';

const BASE = '/admin/training';

// ── Stats ──
export const getTrainingStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
};

// ── Videos ──
export const listVideos = async (params = {}) => {
  const { data } = await api.get(`${BASE}/videos`, { params });
  return data;
};

export const createVideo = async (payload) => {
  const { data } = await api.post(`${BASE}/videos`, payload);
  return data;
};

export const updateVideo = async (id, payload) => {
  const { data } = await api.put(`${BASE}/videos/${id}`, payload);
  return data;
};

export const deleteVideo = async (id) => {
  const { data } = await api.delete(`${BASE}/videos/${id}`);
  return data;
};

// ── Questions ──
export const listQuestions = async (params = {}) => {
  const { data } = await api.get(`${BASE}/questions`, { params });
  return data;
};

export const createQuestion = async (payload) => {
  const { data } = await api.post(`${BASE}/questions`, payload);
  return data;
};

export const updateQuestion = async (id, payload) => {
  const { data } = await api.put(`${BASE}/questions/${id}`, payload);
  return data;
};

export const deleteQuestion = async (id) => {
  const { data } = await api.delete(`${BASE}/questions/${id}`);
  return data;
};

// ── Attempts ──
export const listAttempts = async (params = {}) => {
  const { data } = await api.get(`${BASE}/attempts`, { params });
  return data;
};

export const getVendorAttempts = async (vendorId) => {
  const { data } = await api.get(`${BASE}/attempts/${vendorId}`);
  return data;
};

// ── Vendor Actions ──
export const assignRetraining = async (vendorId, reason = '') => {
  const { data } = await api.post(`${BASE}/assign/${vendorId}`, { reason });
  return data;
};

export const freezeVendor = async (vendorId, reason) => {
  const { data } = await api.post(`${BASE}/freeze/${vendorId}`, { reason });
  return data;
};

export const unfreezeVendor = async (vendorId) => {
  const { data } = await api.post(`${BASE}/unfreeze/${vendorId}`);
  return data;
};
