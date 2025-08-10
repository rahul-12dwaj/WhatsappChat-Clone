# WhatsApp Chat Clone

A real-time WhatsApp-like chat application clone built using **React**, **Tailwind CSS**, **Node.js**, **Express**, and **MongoDB**.

---

## Project Overview

This project replicates the core user interface and messaging experience of WhatsApp, allowing users to chat in real-time, send and receive messages, and enjoy a modern, responsive UI similar to the original WhatsApp web and mobile app.

---

## Technologies Used

- **Frontend:** React, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (NoSQL)  
- **Real-time communication:** (You can add if using Socket.IO or similar)  
- **Icons:** Lucide-react (or any other icon library)  

---

## Features

- Responsive chat UI built with **React** and styled using **Tailwind CSS**  
- User authentication (optional, if implemented)  
- Real-time messaging using REST APIs or WebSocket (add detail if using Socket.IO)  
- Display of message status (sent, delivered, read) with blue ticks similar to WhatsApp  
- Timestamps for each message  
- Different message bubbles for sender and receiver with WhatsApp-style colors  
- Chat input with emoji picker, attachment icon, and send/mic button  
- User presence indicator (e.g., online status)  
- Backend API for storing and retrieving messages  
- Persistent data storage in **MongoDB**  
- Clean, modular, and maintainable codebase  

---

## Installation and Setup

### Backend

1. Clone the repository  
2. Navigate to the backend folder  
3. Install dependencies:  
   ```bash
   npm install


4. Setup your `.env` file with MongoDB connection string and other configs
5. Start the server:

   ```bash
   npm start
   ```

### Frontend

1. Navigate to the frontend folder
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the React development server:

   ```bash
   npm start
   ```

---

## Folder Structure
```

/BWhatsappClone
  ├── payloads/
  ├── server.js
/whatsappClone
  ├── src/
      ├── components/
      ├── App.js
      ├── index.js
  ├── tailwind.config.js
```

## Usage

* Register or login (if implemented)
* Select or create a chat
* Send messages in real-time
* View message status and timestamps
* Enjoy the WhatsApp-like UI experience

---

## Future Improvements

* Add group chats and multi-user conversations
* Implement real-time communication with Socket.IO or WebRTC
* Add media (images, videos) and file sharing support
* Push notifications
* User profile customization
* Deployment scripts and Docker support


---

## Author

Your Name - Rahul Bhardwaj(https://github.com/rahul.12dwaj)

---

## Acknowledgments

* Inspired by WhatsApp Web and mobile app
* Tailwind CSS for utility-first styling
* React community and tutorials

