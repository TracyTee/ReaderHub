# ReaderHub

ReaderHub is a web application for book lovers to discover new books, track their reading, and connect with other readers through community events.

## Features

*   **Comprehensive Book Discovery:**
    *   Search for books by title, author, ISBN, or genre using the Google Books API.
    *   Sort search results by relevance or newest publication date.
    *   Utilizes the Open Library Covers API as a fallback for missing book cover images.
*   **Personalized Bookshelves:**
    *   Save books to a personal "My List" to track reading progress (e.g., "Reading", "Not Finished", "Finished").
    *   Add personal ratings and reviews to books you've read.
*   **Community Event Hub:**
    *   Full event management: create, edit, and delete community events.
    *   RSVP to events to let organizers know you're attending.
    *   View events you are hosting or attending.
*   **Customizable User Profiles:**
    *   Secure user authentication with Firebase.
    *   Personalize your profile with a display name and a choice of avatars.
    *   **Dark/Light Theme:** Switch between dark and light mode for comfortable reading.
*   **Engaging User Experience:**
    *   **Quote of the Day:** See an inspiring book-related quote on the homepage.
    *   **Responsive Design:** A consistent and intuitive interface that works on all screen sizes, featuring a hamburger menu for mobile navigation.
    *   Clean, modern UI with consistent styling across the application.

## Technologies Used

*   **Frontend:**
    *   React
    *   React Router for navigation
    *   Vite for frontend tooling
*   **Backend:**
    *   Firebase (Authentication, Firestore)
*   **APIs:**
    *   Google Books API
    *   Open Library Covers API
*   **Styling:**
    *   CSS with some help from React Icons.

## Project Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd reader-hub
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following environment variables. You can get these from your Firebase project settings and Google Cloud console.

    ```
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_firebase_app_id
    VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## API Documentation

This project uses the following APIs:

*   **Google Books API:** Used for searching and retrieving book information. You need to obtain an API key from the [Google Cloud Console](https://console.cloud.google.com/) and add it to your `.env` file as `VITE_GOOGLE_BOOKS_API_KEY`.
*   **Open Library Covers API:** Used as a fallback to display book cover images when they are not available from the Google Books API. This API is used to fetch images by ISBN.
*   **Firebase:** Used for backend services including:
    *   **Firebase Authentication:** For user sign-up and login.
    *   **Cloud Firestore:** As the database to store user data, book lists, and events.

## Known Limitations or Bugs

### 1. Event Date Handling
* **Issue:** The `Events.jsx` logic relies on the Firestore `date` field having a `.toDate()` method.
* **Impact:** If a document is manually added to Firestore without using a `Timestamp` object (e.g., as a plain string), the event will fail to render or crash the filter logic.
* **Future Fix:** Implement stricter PropType validation and a fallback utility to parse strings into Date objects.


## Challenges 
- Combining development setups after working in seperate repos. Working with no aligned tree structure and firestore setup configuration proved slightly challenging when merging our branches. 

- Accidental key leak into repo required new key generation and key rotation. Use of .env for the environment variables made the fix less painful.

- Spent a signifcant amount of time trying to debug generic errors the APIs returned. Most were just rate limits which were ont explicitly called out. 



