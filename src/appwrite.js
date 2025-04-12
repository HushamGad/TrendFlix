import { Client, Databases, ID, Query } from "appwrite" // Import necessary modules from the Appwrite SDK
// Load environment variables defined in your `.env` file
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID

// Initialize the Appwrite client and set the API endpoint + project ID
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')  // Appwrite Cloud API URL
    .setProject(PROJECT_ID) // Your Appwrite Project ID

// Create a Databases instance to interact with database collections
const database = new Databases(client)

/**
 * Updates the search count of a movie or creates a new search record.
 *
 * If the search term already exists in the database, it increments the `count` field.
 * If not, it creates a new document with count = 1 and basic movie info.
 *
 * @param {string} searchTerm - The search term the user typed
 * @param {object} movie - The first result from the TMDb API (used for metadata)
 */
export const updateSearchCount = async (searchTerm, movie) => {

    try {
        // Step 1: Search the database for existing documents matching the search term
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('searchTerm', searchTerm) // Look for documents where 'searchTerm' field matches
        ])
        // Step 2: If a document exists, update its count field
        if (result.documents.length > 0) {
            const doc = result.documents[0] // Get the first matching document
            // Increment the count by 1
            await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
                count: doc.count + 1
            })
        } else {
            // Step 3: If no document exists for this search term, create a new one
            await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                searchTerm, // Save the search term
                count: 1, // Initial count set to 1
                movie_id: movie.id, // Save the TMDB movie ID
                poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}` // Save the poster image
            })
        }
    } catch (error) {
        // Handle and log any errors that occur during the DB operations
        console.error("Error updating search count:", error)
    }

}
/**
 * Fetches the top 5 most searched movies (trending).
 *
 * Documents are ordered by the `count` field in descending order (most searched first).
 *
 * @returns {Array} - List of trending movie documents from the database
 */
export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5), // Limit to top 5 results
            Query.orderDesc("count") // Sort by descending count (most searched first)
        ])
        return result.documents // Return the list of movie documents
    } catch (error) {
        // Catch and log any errors during DB operations
        console.error("Error fetching trending movies:", error)
    }
}