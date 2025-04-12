import React from 'react'

// This component takes `searchTerm` and `setSearchTerm` as props from the parent component
const Search = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className='search'>
            <div>
                <img src="search.svg" alt="search" />
                <input type="text"
                    placeholder='Search through thousands of movies'
                    value={searchTerm}  // Controlled input, its value is controlled by the state `searchTerm`
                    onChange={(e) => setSearchTerm(e.target.value)} // Updates the search term whenever the input changes
                />
            </div>
        </div>
    )
}

export default Search

