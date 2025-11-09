# Real-time Canvas 🎨

Real-time Canvas is a collaborative drawing web application developed using **HTML5 Canvas, Node.js, Express, and Socket.IO**. It allows multiple users to draw together on the same canvas in real time. Any stroke drawn by one user instantly appears on all other connected screens. This works on both desktop and mobile (touch support enabled).

---

## How It Works
The browser captures drawing actions using the HTML5 canvas API. Each drawing action is emitted to the backend using Socket.IO, and the server broadcasts this event to all connected clients, updating their canvas in real time.

---

## Features
- Live shared drawing board
- Multiple users can draw simultaneously
- Supports mouse (desktop) and touch (mobile)
- Lightweight and fast – no database required

---

## Technologies Used
- **HTML5 Canvas** – drawing surface
- **Node.js + Express** – backend server
- **Socket.IO** – real-time connections between users

---

## Project Setup (How to Run)

1. Download or clone the project:
   
   git clone https://github.com/your-username/real-time-canvas.git
   cd real-time-canvas
Install required dependencies:


npm install
Start the application:


node app.js
Open the app in your browser:

arduino
Copy code
http://localhost:3000
Open the same URL in multiple browser tabs or different devices to test real-time drawing.

Project Structure
pgsql
Copy code
Real-time-canvas/
│── public/      → frontend JavaScript + CSS
│── views/       → UI (EJS templates)
│── routes/      → routing files
│── app.js       → backend server + Socket.IO handling
│── package.json → dependencies
Output (What Happens)
User opens localhost:3000

Draws on the canvas

Drawing appears instantly on every connected client

