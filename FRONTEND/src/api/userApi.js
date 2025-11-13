import axios from "./axiosInstance";

const userApi = {
	upsertUser: async ({ email, name, picture }) => {
		const res = await axios.post(`/users/upsert`, { email, name, picture });
		return res.data;
	},

	getUser: async (id) => {
		const res = await axios.get(`/users/${id}`);
		return res.data;
	},

	addFavorite: async (userId, movieId) => {
		const res = await axios.post(`/users/${userId}/favorites/${movieId}`);
		return res.data;
	},

	removeFavorite: async (userId, movieId) => {
		const res = await axios.delete(`/users/${userId}/favorites/${movieId}`);
		return res.data;
	},

	addWatchLater: async (userId, movieId) => {
		const res = await axios.post(`/users/${userId}/watch-later/${movieId}`);
		return res.data;
	},

	removeWatchLater: async (userId, movieId) => {
		const res = await axios.delete(`/users/${userId}/watch-later/${movieId}`);
		return res.data;
	},
};

export default userApi;
