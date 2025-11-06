# Chat App - Backend

This is the backend for a real-time chat application. It handles user authentication, messaging, push notifications, and WebRTC signaling for audio calls.

## Features

-   **User Authentication:** Secure user login and registration using Supabase Auth.
-   **Real-time Chat:** WebSocket-based real-time messaging with Socket.IO.
-   **Audio Calls:** WebRTC signaling for one-on-one audio calls.
-   **Push Notifications:** Firebase Cloud Messaging for sending push notifications to users.
-   **Profile Management:** API endpoints for updating user profiles, including profile picture uploads to Supabase Storage.
-   **Message History:** Stores and retrieves chat history from a PostgreSQL database.
-   **User Search:** Allows users to search for other users.

## Technologies Used

-   **Node.js:** JavaScript runtime environment.
-   **Express.js:** Web framework for Node.js.
-   **PostgreSQL:** Open-source relational database.
-   **Supabase:** Backend-as-a-Service platform for authentication, database, and storage.
-   **Socket.IO:** Library for real-time web applications.
-   **Firebase Admin SDK:** For sending push notifications from the server.
-   **Multer:** Middleware for handling `multipart/form-data`, used for file uploads.

## API Endpoints

-   `POST /api/profile/upload-profile`: Upload a new profile picture.
-   `GET /api/chat/messages`: Get messages between two users.
-   `GET /api/chat/get-chat-user`: Get the details of a chat user.
-   `GET /api/chat/get-unread-messages/:userId`: Get the count of unread messages for a user.
-   `GET /api/user/currentUser`: Get the details of the currently logged-in user.
-   `POST /api/user/save-token`: Save a Firebase Cloud Messaging (FCM) token for a user.
-   `GET /api/user/interacted-users`: Get a list of users that the current user has interacted with.
--   `GET /api/user/searchquery`: Search for users by their name.

## Socket.IO Events

-   `registerUser`: Register a user and map their user ID to their socket ID.
-   `sendMessage`: Send a message to another user.
-   `markAsRead`: Mark messages as read.
-   `callUser`: Initiate a call to another user.
-   `cancelCall`: Cancel an outgoing call.
-   `acceptCall`: Accept an incoming call.
-   `rejectCall`: Reject an incoming call.
-   `endCall`: End an ongoing call.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Vijay-papanaboina/chat-app-backend.git
    cd chat-app-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the root directory and add the following environment variables:
    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_SECRET_KEY=your_supabase_secret_key
    DB_USER=your_database_user
    DB_HOST=your_database_host
    DB_NAME=your_database_name
    DB_PASS=your_database_password
    DB_PORT=your_database_port
    PORT=your_desired_port
    ```

4.  **Start the server:**
    ```bash
    npm start
    ```

## Frontend

The frontend for this application is in a separate repository. You can find it here: [https://github.com/Vijay-papanaboina/chat-app-frontend](https://github.com/Vijay-papanaboina/chat-app-frontend)
