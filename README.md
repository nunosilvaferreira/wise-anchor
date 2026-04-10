# Overview

WiseAnchor is a web app that helps users build a predictable daily routine, add custom tasks, and review calming guidance when they need extra structure. The current version supports both local-only storage on a single device and optional Firebase-backed authentication and sync for multi-device use.

The project is designed around three usage modes:

1. Local guest mode
The routine is stored only on the current device with browser storage.

2. Independent account mode
A functional autistic user can register and sync their own routine across devices with Firebase.

3. Caregiver mode
A parent or caregiver can register, create dependent profiles, and manage routines for children under 18 or adults with severe support needs.

This project fulfills the CSE 310 Module #3 Web Apps requirements by using Next.js and React to render multiple interactive pages, respond to user input, and dynamically display stored routine data. It also goes beyond the minimum requirement by including account-based sync, caregiver workflows, and more than two dynamic pages.

[Software Demo Video](http://youtube.link.goes.here)

# Setup

1. Install dependencies:
`pnpm install`

2. For local-only mode, start the project directly:
`pnpm dev`

3. To enable Firebase authentication and sync, copy `.env.example` to `.env.local` and fill in the Firebase web app values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. In Firebase Console, enable:
- Authentication with Email/Password
- Cloud Firestore

5. Start the development server:
`pnpm dev`

6. Open `http://localhost:3000`

# Authentication And Sync

When Firebase is configured, the app uses Firebase Authentication for login and registration, and Firestore for profile and task storage. Firestore is initialized with offline persistence, so each device keeps a cached local copy of the latest synced data.

This means the app can work in a local-first way:
- changes are available on the current device immediately
- changes sync between devices when the same account is used on multiple devices
- cached routine data remains available offline

Caregiver accounts can create and switch between dependent profiles. Independent accounts manage their own single synced profile.

# Web Pages

The `Today` page is the main routine dashboard. It loads saved tasks and personal details either from browser storage in guest mode or from the active Firebase profile in synced mode, shows a live day and time display, calculates completion statistics, and lets the user mark tasks as complete or clear completed items. The content on this page changes based on the tasks the user has added, edited, or completed.

The `Add Task` page lets the user create a new task by entering a task name, time, and routine section. The available sections are generated from JavaScript data, the form validates input, and the new task is added to the stored routine before the page returns the user to the dashboard.

The `Settings` page gives the user two dynamic editing areas: personal details and daily tasks. It loads the saved local or synced profile, allows task editing and deletion, supports restoring the default task list, and updates the shared app state used by the other pages.

The `Calm Steps` page acts as an additional dynamically generated page for the stretch challenge. It uses stored date-of-birth and gender information together with a user-selected mood to display different avatar sets and a guided sequence of calming actions.

The `Login` and `Register` pages provide account access for caregivers and independent users when Firebase is configured.

The `Caregiver` page lets a caregiver manage dependent profiles and switch the active routine between linked users.

Navigation between pages is handled by the shared header, and the `Add Task` page also redirects back to `Today` after a successful save.

# Development Environment

I used Visual Studio Code, Node.js, pnpm, Next.js, React, and browser developer tools to build and test this web app.

The application is written in JavaScript and uses the Next.js App Router for page generation, React for interactive UI logic, CSS Modules for component styling, `date-fns` for readable date and time formatting, and Firebase for authentication and cross-device synchronization.

# Netlify Deployment

This project can be deployed on Netlify as a standard Next.js application.

To deploy:

1. Push the repository to GitHub.
2. Import the repository into Netlify.
3. Add the same `NEXT_PUBLIC_FIREBASE_*` environment variables in the Netlify dashboard.
4. Use the default Next.js build detection, or the standard command:
`pnpm build`
5. Publish the site.

Netlify hosts the application itself. Firebase stores the shared profile and task data. Firestore offline persistence keeps a cached copy on each device, which is the closest match to "store locally on the device" while still allowing sync between devices.

# Useful Websites

* [Next.js Documentation](https://nextjs.org/docs)
* [React Documentation](https://react.dev/)
* [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
* [date-fns Documentation](https://date-fns.org/)
* [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
* [Firebase Authentication for Web](https://firebase.google.com/docs/auth/web/start)
* [Cloud Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
* [Netlify Next.js Overview](https://docs.netlify.com/frameworks/next-js/overview/)
* [CSE 310 Module Summary](https://byui-cse.github.io/cse310-course/modules/module_descriptions.html)

# Future Work

* Add secure invitation flows so a caregiver and an independent user can share the same profile without using the same login.
* Add notifications and reminders for upcoming routine tasks.
* Let users reorder tasks directly from the dashboard with drag-and-drop controls.
