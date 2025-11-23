import axiosInstance from './axiosInstance';

/**
 * Create a new watch party room
 */
export const createWatchParty = async (movieId) => {
  try {
    const response = await axiosInstance.post('/watch-party/create', {
      movieId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating watch party:', error);
    throw error;
  }
};

/**
 * Get watch party details
 */
export const getWatchParty = async (roomId) => {
  try {
    const response = await axiosInstance.get(`/watch-party/${roomId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting watch party:', error);
    throw error;
  }
};

/**
 * Join an existing watch party
 */
export const joinWatchParty = async (roomId) => {
  try {
    const response = await axiosInstance.post(`/watch-party/${roomId}/join`);
    return response.data;
  } catch (error) {
    console.error('Error joining watch party:', error);
    throw error;
  }
};

/**
 * Leave a watch party
 */
export const leaveWatchParty = async (roomId) => {
  try {
    const response = await axiosInstance.post(`/watch-party/${roomId}/leave`);
    return response.data;
  } catch (error) {
    console.error('Error leaving watch party:', error);
    throw error;
  }
};
