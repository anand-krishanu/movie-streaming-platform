import MovieCard from "./MovieCard";
import * as ScrollArea from "@radix-ui/react-scroll-area";

export default function GenreRow({ genre, movies }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-3">{genre}</h2>
      <ScrollArea.Root className="w-full overflow-hidden">
        <ScrollArea.Viewport className="flex space-x-4 pb-2">
          {movies.map((movie) => (
            <MovieCard key={movie.movieId} movie={movie} />
          ))}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="horizontal"
          className="h-1 bg-neutral-700 rounded"
        >
          <ScrollArea.Thumb className="bg-red-500 rounded" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </section>
  );
}