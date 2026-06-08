Changes made

- Fixed image preview and upload handling in `src/pages/CreateInvitation.jsx`.
  - Moved `selectedImage` and `imagePreview` to component-level state.
  - Imported and used `uploadCoverImage` from `src/services/storageService.js`.
  - Removed invalid nested `useState` calls.

- Dashboard fixes in `src/pages/Dashboard.jsx`.
  - Imported `themes` and `deleteInvitation`.
  - Implemented `handleDelete` with user feedback via `react-hot-toast`.

- Added minimal styling in `src/index.css` for inputs, buttons, and images.

- Fixed Firebase storage bucket configuration in `src/services/firebase.js` (use `.appspot.com`).

- Improved `src/services/storageService.js`:
  - Sanitizes filenames to remove unsafe characters.
  - Adds try/catch around upload so upload errors surface clearly.

- Added `ImageUploader` component (`src/components/ImageUploader.jsx`) to centralize
  file validation and preview for cover images.

- Enhanced create flow in `src/pages/CreateInvitation.jsx` to show a simple
  upload progress indicator and to use the `ImageUploader` component.

- Added layout components:
  - `src/components/Header.jsx` — top navigation with auth status.
  - `src/components/Footer.jsx` — small footer.

- Implemented `src/contexts/AuthContent.jsx` as a passthrough to avoid an empty file.

- Improved UX:
  - `src/pages/Home.jsx` now has a simple landing section and primary actions.
  - `src/pages/Dashboard.jsx` shows a confirmation prompt before deleting an invitation.

- Added editing & duplication features:
  - `src/pages/EditInvitation.jsx` to edit an existing invitation (accessible by slug).
  - `Dashboard` now includes a `Duplicate` action to clone an invitation and copy new link.

- Interactive questions:
  - `Create`/`Edit` flows allow adding simple questions stored on the invitation document.
  - `InvitationView` renders questions and supports submitting answers (stored in `responses`).

- Added a sample Cloud Function scaffold (`functions/signedUploadFunction.js`) to implement secure signed uploads for guest image uploads.
  
- Client signed-upload helper:
  - `src/services/signedUpload.js` — callable Cloud Function helper to request a signed upload URL from the server.

- Analytics:
  - Added `src/components/AnalyticsCharts.jsx` and integrated it into `Dashboard` to show per-invitation views/responses using Chart.js.

- Styling and theme:
  - Added modern theme variables and utility classes in `src/index.css` (cards, buttons, danger variant).
  - Updated `src/components/Header.jsx` to use the new classes and make the `Logout` button red (`btn-danger`).

- Mobile & accessibility improvements:
  - Added responsive nav with a hamburger toggle and dropdown for smaller screens (`src/components/Header.jsx`, `src/index.css`).
  - Converted multiple pages to responsive layouts: `CreateInvitation`, `Dashboard`, and `InvitationView` now stack/flow on small screens.
  - Added labels and `id` attributes for form fields on `CreateInvitation.jsx` and `EditInvitation.jsx` for better accessibility and clarity.

- WhatsApp / phone improvements:
  - Added a country code selector and phone normalization helper to `CreateInvitation.jsx` and `EditInvitation.jsx` so local numbers like `078...` normalize to `+26378...` on blur.

- Phone parsing upgrade:
  - Integrated `libphonenumber-js` (added to `package.json`) and used it for parsing/formatting phone numbers in `CreateInvitation.jsx` and `EditInvitation.jsx`. Falls back to simple normalization when parsing fails.

- Quick defaults:
  - Added 'Use default' buttons for the main invitation message and the WhatsApp success-action message in Create/Edit pages so users can quickly apply template text.

- Interactive mode (MVP):
  - Added a new "Interactive" invitation mode in `CreateInvitation.jsx` and a public multi-step `InteractiveInvite` flow at `/interactive/:slug`.
  - The interactive flow guides recipients through: initial question, date/time, mood, activity, final reveal, and RSVP confirmation. Responses save answers to Firestore via `submitResponse`.
  - Reused the `ConfirmModal` component for final reveal confirmation.

- Animations & persistence:
  - Added Framer Motion transitions to the interactive flow for smooth step changes.
  - Decorative heart visuals added to the interactive card for a romantic theme.
  - When a recipient confirms their RSVP in the interactive flow, their chosen answers are persisted to the invitation document under `lastResponse` for host visibility.

- UI polish:
  - Added selected/pressed styling for choice buttons and improved spacing for small screens.
  - Confirmation modal now focuses the primary action button when opened for better accessibility.

- Autosave & accessibility:
  - The interactive flow now autosaves draft answers (`draftResponse`) to the invitation document as the recipient progresses (debounced).
  - Confirmation modal traps focus and restores focus behavior for better keyboard accessibility.

- UI polishing:
  - Removed redundant logout button on Dashboard and improved action button wrapping on small screens.

More:
- Implemented the playful runaway NO button on `InvitationView` (runs away on pointer, hides when held for 1s, reappears after 5s).

If you'd like, I can now:
- Expand the phone country selector (or integrate libphonenumber for robust parsing).
- Add a small 'Use default message' quick-select UI for message templates on both Create/Edit.
- Add end-to-end tests or a small local-check script to validate mobile layouts.

What I tested

- Read project docs: `Project.md`, `InvitationsFlow.md`, `DB.md` to understand goals and data model.
- Verified `uploadCoverImage` exists in `src/services/storageService.js` and integrated it.

Notes / Next steps

- I made targeted fixes to resolve runtime errors related to image preview and missing imports.
- I added lightweight styling; you may want a more thorough design (Tailwind was listed in `Project.md`).
- I didn't run the app in this environment — please run locally and tell me any remaining errors or desired UI changes.
