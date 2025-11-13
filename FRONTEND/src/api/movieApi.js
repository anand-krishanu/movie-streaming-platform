import axios from "./axiosInstance";

const movieApi = {
	// list movies with pagination: { page, limit }
	fetchMovies: async ({ page = 1, limit = 24 } = {}) => {
		const res = await axios.get(`/movies?page=${page}&limit=${limit}`);
		return res.data;
	},

	getMovieById: async (id) => {
		const res = await axios.get(`/movies/${id}`);
		return res.data;
	},

	searchMovies: async (q) => {
		const res = await axios.get(`/movies/search?q=${encodeURIComponent(q || "")}`);
		return res.data;
	},

	getTopRated: async () => {
		const res = await axios.get(`/movies/aggregate/top-rated`);
		return res.data;
	},

	// Aggregations
	getByGenreAggregate: async () => {
		const res = await axios.get(`/movies/aggregate/by-genre`);
		return res.data;
	},

	getStatsAggregate: async () => {
		const res = await axios.get(`/movies/aggregate/stats`);
		return res.data;
	},

	// admin style mutators (left for future use)
	createMovie: async (payload) => {
		const res = await axios.post(`/movies`, payload);
		return res.data;
	},

	updateMovie: async (id, payload) => {
		const res = await axios.put(`/movies/${id}`, payload);
		return res.data;
	},

	deleteMovie: async (id) => {
		const res = await axios.delete(`/movies/${id}`);
		return res.data;
	},
};

export default movieApi;
