# Rootine

<img width="1038" height="680" alt="logo" src="https://github.com/user-attachments/assets/6c4c707b-155d-432d-9d06-808c6c32251d" />

Rootine is a habit-building fitness app that turns daily goals into a growing tree. Finish your goals and the tree grows. Miss a day and it withers, but finishing your goals again brings it back to life. Daily tasks are verified with your camera, and lifetime XP unlocks tree skins that stay unlocked, so a withered tree never takes away rewards you have already earned.
 
Built for the **"Revitalize"** hackathon prompt.
 
## Table of contents
 
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)

## Features
 
- **Daily tasks with camera verification:** a pose-detection service follows your movement and counts reps before a task is marked complete.
- **Growing tree:** your tree's stage reflects your progress, from seed to fully grown, and it withers when you fall behind.
- **Workout logging:** start a workout, log sets with exercise, reps, and weight, then finish it to save it to your history.
- **XP and tree skins:** earn lifetime XP to unlock skins such as Sapling, Oak, Pine, Cherry, and Golden. Equipping a skin is saved on your device.
- **Weekly tasks:** a longer goal that gives bonus XP when you complete it.
- **Accounts:** register, log in, and log out. Expired sessions are cleared and sent back to the login page automatically.
## How it works
 
1. **Sign up or log in.** Your session is stored as a JWT token in the browser.
2. **Complete daily tasks.** Each task opens the camera. When the pose service confirms the movement, the task is marked done and XP is added.
3. **Watch your tree respond.** Finished goals move the tree toward a healthier stage. Missed days move it toward withering.
4. **Log workouts.** Start a workout, add sets, and finish it. Completed workouts show up in your history.
5. **Unlock and equip skins.** XP unlocks new tree skins, and you choose which one to show on your dashboard.
## Tech stack
 
| Layer | Technologies |
| --- | --- |
| Front end | React 19, Vite, React Router, TensorFlow.js pose detection |
| Back end | Node.js, Express, Prisma, JWT authentication |
| Vision service | Python pose detection, served as its own HTTP API |
| Hosting | Railway |
 
## Project structure
 
```
rootine/
├── client/                    React front end (Vite)
│   └── src/
│       ├── App.jsx            Routes and route guards
│       ├── api.js             API client, token and profile storage
│       ├── Frontpage.jsx      Landing page
│       ├── LoginPage.jsx      Log in
│       ├── RegisterPage.jsx   Create an account
│       ├── Dashboard.jsx      Tree, status, and daily and weekly tasks
│       ├── TaskCamera.jsx     Camera flow for completing a task
│       ├── Workout.jsx        Workout logging
│       ├── Cosmetics.jsx      Tree skins and XP progress
│       ├── tasks.js           Daily and weekly task definitions
│       ├── skins.js           Tree skin definitions and images
│       └── pose.js            Pose detection helpers
├── server/                    Express API
│   ├── prisma/
│   │   ├── schema.prisma      Database schema
│   │   └── migrations/        Migration history
│   └── src/
│       ├── app.js             Express setup and middleware
│       ├── server.js          Server entry point
│       ├── routes/            Route definitions
│       ├── controllers/       Request handlers
│       ├── middlewares/       Auth middleware
│       ├── utils/             Progression logic
│       └── prompts/           Prompt templates for the coach feature
└── vision/                    Python pose-detection service
    ├── cv_service.py          Pose detection API
    ├── requirements.txt       Python dependencies
    └── workout_test.html      Manual test page for the vision service
```
 
## Getting started
 
### Prerequisites
 
- Node.js (a current LTS version)
- Python 3.10 or newer
- A database that Prisma supports, configured in `server/.env`
