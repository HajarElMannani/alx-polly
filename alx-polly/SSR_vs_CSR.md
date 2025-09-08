# SSR vs CSR Documentation

This document outlines the rendering strategy for each page in the `app` directory.

## Pages

### `app/page.tsx`

-   **Rendering:** Client-Side Rendering (CSR)
-   **Reasoning:** This page uses the `useAuth` hook to display different content based on the user's authentication status. This requires client-side state and is therefore a client component.

### `app/create-poll/page.tsx`

-   **Rendering:** Client-Side Rendering (CSR)
-   **Reasoning:** This is a form with significant client-side state and interactivity for creating a new poll. The form submission is handled by a Server Action, but the page itself remains a client component.

### `app/explore/page.tsx`

-   **Rendering:** Server-Side Rendering (SSR)
-   **Reasoning:** This page displays a list of public polls. The data is fetched on the server and the page is rendered on the server. This improves performance and SEO.

### `app/login/page.tsx`

-   **Rendering:** Client-Side Rendering (CSR)
-   **Reasoning:** This is a classic login form with client-side state for handling user input and authentication.

### `app/polls/page.tsx`

-   **Rendering:** Server-Side Rendering (SSR) with a Client-Side Component
-   **Reasoning:** The initial list of polls is fetched on the server. The page then renders a client component (`PollsList`) to handle client-side interactions like deleting and sharing polls.

### `app/polls/[id]/page.tsx`

-   **Rendering:** Server-Side Rendering (SSR) with a Client-Side Component
-   **Reasoning:** The initial poll data is fetched on the server. The page then renders a client component (`VoteForm`) to handle the voting process, which is interactive.

### `app/polls/[id]/edit/page.tsx`

-   **Rendering:** Server-Side Rendering (SSR) with a Client-Side Component
-   **Reasoning:** The initial poll data is fetched on the server. The page then renders a client component (`EditPollForm`) to handle the editing process, which is interactive. The form submission is handled by a Server Action.

### `app/polls/[id]/results/page.tsx`

-   **Rendering:** Server-Side Rendering (SSR)
-   **Reasoning:** This page displays the results of a poll. The data is fetched on the server and the page is rendered on the server. This is ideal for performance and SEO as the content is not interactive.

### `app/profile/page.tsx`

-   **Rendering:** Client-Side Rendering (CSR)
-   **Reasoning:** This page contains forms for updating a user's profile and password. It requires client-side state and interactivity. The form submissions are handled by Server Actions.

### `app/register/page.tsx`

-   **Rendering:** Client-Side Rendering (CSR)
-   **Reasoning:** This is a classic registration form with client-side state for handling user input and registration.
