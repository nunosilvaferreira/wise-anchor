# Overview

WiseAnchor is a web app that helps users build a predictable daily routine, add custom tasks, and review calming guidance when they need extra structure. The current version uses Firebase-backed authentication and sync for multi-device use, including caregiver alerts sent through Firebase Cloud Messaging.

The project is designed around two account types:

1. Independent account mode
A functional autistic user can register and sync their own routine across devices with Firebase.

2. Caregiver mode
A parent or caregiver can register, create dependent profiles, and manage routines for children under 18 or adults with severe support needs.

This project fulfills the CSE 310 Module #3 Web Apps requirements by using Next.js and React to render multiple interactive pages, respond to user input, and dynamically display stored routine data. It also goes beyond the minimum requirement by including account-based sync, caregiver workflows, and more than two dynamic pages.

[Software Demo Video](https://youtu.be/Xz1Fqv-eUbo)

# Authentication And Sync

When Firebase is configured, the app uses Firebase Authentication for login and registration, Firestore for profile and task storage, and Firebase Cloud Messaging for caregiver push alerts. Firestore is initialized with offline persistence, so each device keeps a cached local copy of the latest synced data.

This means the app can work in a local-first way:
- changes are available on the current device immediately
- changes sync between devices when the same account is used on multiple devices
- cached routine data remains available offline

Caregiver accounts can create and switch between dependent profiles. Independent accounts manage their own single synced profile. A caregiver device can enable push notifications from the Caregiver page, and urgent feelings or SOS events from the dependent profile trigger a real-time push alert.

# Web Pages

The `Today` page is the main routine dashboard. It loads saved tasks and personal details either from browser storage in guest mode or from the active Firebase profile in synced mode, shows a live day and time display, calculates completion statistics, and lets the user mark tasks as complete or clear completed items. The content on this page changes based on the tasks the user has added, edited, or completed.

The `Add Task` page lets the user create a new task by entering a task name, time, and routine section. The available sections are generated from JavaScript data, the form validates input, and the new task is added to the stored routine before the page returns the user to the dashboard.

The `Settings` page gives the user two dynamic editing areas: personal details and daily tasks. It loads the saved local or synced profile, allows task editing and deletion, supports restoring the default task list, and updates the shared app state used by the other pages.

The `Calm Steps` page acts as an additional dynamically generated page for the stretch challenge. It uses stored date-of-birth and gender information together with a user-selected mood to display different avatar sets and a guided sequence of calming actions.

The `Login` and `Register` pages provide account access for caregivers and independent users when Firebase is configured.

The `Caregiver` page lets a caregiver manage dependent profiles, switch the active routine between linked users, enable caregiver push alerts on the current device, and send a real push test.

Navigation between pages is handled by the shared header, and the `Add Task` page also redirects back to `Today` after a successful save.

# Development Environment

I used Visual Studio Code, Node.js, pnpm, Next.js, React, and browser developer tools to build and test this web app.

The application is written in JavaScript and uses the Next.js App Router for page generation, React for interactive UI logic, CSS Modules for component styling, `date-fns` for readable date and time formatting, and Firebase for authentication and cross-device synchronization.

# Useful Websites

* [Next.js Documentation](https://nextjs.org/docs)
* [React Documentation](https://react.dev/)
* [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
* [date-fns Documentation](https://date-fns.org/)
* [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
* [Firebase Authentication for Web](https://firebase.google.com/docs/auth/web/start)
* [Cloud Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
* [Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
* [Firebase Cloud Messaging for Web](https://firebase.google.com/docs/cloud-messaging/web/get-started)
* [Firebase Admin SDK Messaging](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk)
* [Firebase Cloud Messaging Product Page](https://firebase.google.com/products/cloud-messaging)
* [CSE 310 Module Summary](https://byui-cse.github.io/cse310-course/modules/module_descriptions.html)

# Future Work

* Add secure invitation flows so a caregiver and an independent user can share the same profile without using the same login.
* Let users reorder tasks directly from the dashboard with drag-and-drop controls.
* Replace password login on mobile with a passkey or native biometric flow.
