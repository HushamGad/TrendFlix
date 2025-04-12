import React, { useState, useEffect } from 'react' // Import core React functionality, including hooks
import Search from './components/Search'; // Import the Search component for the input field
import Spinner from './components/Spinner'; // Import the Spinner component for showing loading state
import MovieCard from './components/MovieCard'; // Import the MovieCard component to display each movie
import { useDebounce } from 'react-use' // Import useDebounce hook to optimize API calls while typing
import { getTrendingMovies, updateSearchCount } from './appwrite'; // Import function to track the search count (likely updates a DB or analytics)


// VITE_TMDB_API_KEY is a custom environment variable that holds your API key.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY


// Define the API options for making requests to the movie database API.
const API_OPTIONS = {
  method: 'GET',  // The HTTP method we are using for the request. In this case, it's a GET request.
  headers: {   // Define the headers for the request. These headers are necessary for making requests to the API.
    accept: 'application/json',  // The API expects the response to be in JSON format.
    Authorization: `Bearer ${API_KEY}` // The Authorization header is used to authenticate the request. 
  }
}

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('') // Hold the debounced version of the search term
  const [searchTerm, setSearchTerm] = useState("") // Store search input from the user
  const [movieList, setMovieList] = useState([])  // Store list of movies fetched from the API
  const [errorMessage, setErrorMessage] = useState("") // Store error messages if the fetch fails
  const [isLoading, setIsLoading] = useState(false) // Track loading state while fetching data
  const [isTrendingLoading, setIsTrendingLoading] = useState(false) // Track loading for trending movies
  const [trandingMovies, setTtendingMovies] = useState([]) // Store trending movies fetched from Appwrite

  // Debounce the searchTerm by 500ms to reduce API calls on every keystroke
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  // Function to fetch movies from the API based on search or discovery
  const fetchMovies = async (query = '') => {
    setIsLoading(true) // Show the loading spinner while fetching
    setErrorMessage('') // Clear any previous error messages

    // Choose the correct endpoint: search or discover
    const endpoint = query
      ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`
      : 'https://api.themoviedb.org/3/discover/movie'

    try {
      // Perform the actual fetch request to TMDB API
      const response = await fetch(endpoint, API_OPTIONS)
      // If the response is not OK (status not in 200–299), throw an error
      if (!response.ok) {
        throw new Error('Failed to fetch movies')
      }
      // Parse the response JSON data
      const data = await response.json()
      // TMDB sometimes uses a field called "Response" (mainly in old APIs), check if it's false
      if (data.Response === 'false') {
        setErrorMessage(data.Error || 'Failed to fetch movies') // Show specific error if available
        setMovieList([]) // Clear any old movie results
      } else {
        // If movies are returned, update the state
        setMovieList(data.results || []) // Use empty array as fallback to avoid errors

        // If the user searched and results are available, update search count in Appwrite
        if (query && data.results.length > 0) {
          try {
            await updateSearchCount(query, data.results[0]) // Send first movie as metadata
          } catch (err) {
            console.warn('Failed to update search count:', err) // Log warning if Appwrite update fails
          }
        }
      }
    } catch (error) {
      // Catch any unexpected errors (network issues, etc.)
      console.error('Error fetching movies:', error)
      setErrorMessage('Error fetching movies. Please try again later.')
    } finally {
      setIsLoading(false) // Always stop the spinner, whether success or error
    }
  }
  // Function to load trending movies using Appwrite (runs only once when the app loads)
  const loadTrendingMovies = async () => {
    setIsTrendingLoading(true) // Start spinner
    try {
      const movies = await getTrendingMovies() // Fetch trending movies from Appwrite
      setTtendingMovies(movies) // Update the state with the trending movies
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`) // Log error if fetch fails

    } finally {
      setIsTrendingLoading(false) // Stop spinner
    }
  }
  // It allows you to perform side effects, like fetching data or manipulating the DOM,
  useEffect(() => {  // useEffect runs the fetchMovies when debouncedSearchTerm changes
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm]) // Dependency: Only runs when search term is updated (after debounce)

  useEffect(() => {
    loadTrendingMovies() // Call this once on component mount to load trending movies
  }, []) // Empty dependency array ensures this runs only once
  return (
    <main>

      <div className="pattern" /> {/* This div acts as a background pattern or decoration for the page */}
      <div className="wrapper">
        <header>
          <h1>
            <img src="./hero.png" alt="Hero Banner" />
            Find <span className="text-gradient">Movies</span>  You'll Enjoy Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} /> {/* Search component to allow the user to input a search term */}
        </header>
        {isTrendingLoading ? (
          <section className='trnding'>
            <h2>Trending Movies</h2>
            <Spinner /> {/* Show spinner while trending movies are loading */}
          </section>
        ) : trandingMovies.length > 0 && (
          <section className='trending'> {/* Section for displaying trending movies if they exist */}
            <h2>Trending Movies</h2>
            <ul>
              {trandingMovies.map((movie, index) => (
                <li key={movie.$id}> {/* Use Appwrite document ID as a unique key */}
                  <p>{index + 1}</p> {/* Show the movie rank number */}
                  <img src={movie.poster_url} alt={movie.title} /> {/* Display movie poster and alt text */}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className='all-movies'>
          <h2>All Movies</h2>
          {/* Conditional rendering to handle different states */}
          {isLoading ? (  // Display a loading spinner while the movies are being fetched
            <Spinner />
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p> // Display an error message if there was a problem fetching the movies
          ) : (
            <ul> {/* Loop through movieList and render a MovieCard for each */}
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}

        </section>
      </div>
    </main>
  )
}

export default App

