# WiseAnchor

## Overview

WiseAnchor is a routine support web app for CSE 310.  
For Module #2 (`Language - JavaScript`), this project extends the Week 02 app with deeper JavaScript logic, recursion, library integration, and stronger validation.

## Video Links

- Week 02 Demo: https://youtu.be/2nSmHbbe2jQ
- Module #2 Demo + Code Walkthrough: `ADD_VIDEO_LINK_HERE`

## Module #2 Requirements Coverage

1. Display output to the screen
- Dynamic routine board with live day/time and completion metrics
- Daily insights cards (next task and highest remaining section)
- Progress-by-section bars updated from task state

2. Native Array ES6 functions
- `map`, `filter`, `sort`, and `reduce` are used to:
- Compute completion rates
- Rank sections by pending workload
- Build section-level progress summaries

3. Recursion
- `flattenGuidedSteps` in `src/components/calm-steps.js` recursively expands nested calming paths into a guided sequence with depth-based indentation.

4. JavaScript library by someone else
- `date-fns` is integrated for date/time formatting and parsing in `src/components/routine-board.js`.

Stretch challenge (exceptions)
- `TaskValidationError` in `src/lib/task-storage.js` is thrown for invalid task input and handled in UI forms.

## Features

- Multi-page Next.js app (`Today`, `Add Task`, `Settings`, `CalmSteps`)
- Task persistence with `localStorage`
- Personal details profile
- Editable daily routine sections
- Recursive guided calming sequences

## Tech Stack

- Next.js
- React
- JavaScript
- CSS Modules
- date-fns
- pnpm

## How to Run

1. Install dependencies:
```bash
pnpm install
```

2. Start development server:
```bash
pnpm dev
```

3. Open the local URL shown in the terminal.

## Useful References

- https://nextjs.org/docs
- https://developer.mozilla.org/en-US/docs/Web/JavaScript
- https://date-fns.org/
