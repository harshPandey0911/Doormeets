/**
 * trainingService.js — Vendor-facing training API calls
 */

import api from './api';

const BASE = '/vendors/training';

/**
 * Get vendor's current training status, level, cooldown info
 */
export const getTrainingStatus = async () => {
  const { data } = await api.get(`${BASE}/status`);
  return data;
};

/**
 * Get all active training videos with vendor's watch progress
 */
export const getTrainingVideos = async () => {
  const { data } = await api.get(`${BASE}/videos`);
  return data;
};

/**
 * Mark a video as watched (or update watch progress)
 * @param {string} videoId
 * @param {number} watchedSeconds
 * @param {boolean} fullyWatched
 */
export const markVideoWatched = async (videoId, watchedSeconds = 0, fullyWatched = false) => {
  const { data } = await api.post(`${BASE}/watch`, { videoId, watchedSeconds, fullyWatched });
  return data;
};

/**
 * Get MCQ test questions (shuffled, correct answers hidden)
 */
export const getTestQuestions = async () => {
  const { data } = await api.get(`${BASE}/test`);
  return data;
};

/**
 * Submit MCQ answers
 * @param {Array} answers — [{ questionId, selectedOptionIndex }]
 */
export const submitTest = async (answers) => {
  const { data } = await api.post(`${BASE}/submit`, { answers });
  return data;
};
