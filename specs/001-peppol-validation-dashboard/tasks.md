# Tasks: ValidPEP PEPPOL BIS Billing Validation Dashboard

**Input**: Design documents from `/specs/001-peppol-validation-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both frontend and backend.

- [ ] T001 Create base project directories: `backend/`, `frontend/`
- [ ] T002 Initialize Node.js project in `backend/`
- [ ] T003 Initialize React/TypeScript project in `frontend/`
- [ ] T004 Configure Tailwind CSS in `frontend/`
- [ ] T005 Configure Vite in `frontend/`
- [ ] T006 Configure Next.js API Routes in `backend/`
- [ ] T007 Configure linting and formatting tools for both `backend/` and `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented. This includes setting up the validation engine, caching, and basic API routing.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Setup Vercel Serverless Functions environment in `backend/`
- [ ] T009 Implement basic API routing structure for `/api/validate` in `backend/src/api/validate.ts`
- [ ] T010 Configure Vercel KV (Redis) for caching in `backend/src/utils/cache.ts`
- [ ] T011 Implement utility for loading and caching PEPPOL validation artifacts (XSD, Schematron) in `backend/src/services/peppolArtifacts.ts`
- [ ] T012 Implement core XML parsing and XSD validation logic using `libxmljs2` in `backend/src/services/xmlParser.ts`
- [ ] T013 Implement core Schematron validation logic using `xslt3` or similar in `backend/src/services/schematronValidator.ts`
- [ ] T014 Setup basic error handling and logging infrastructure for `backend/`
- [ ] T015 Create base `Issue` and `ValidationResult` data structures in `backend/src/types/validation.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Drag and Drop Validation (Priority: P1) 🎯 MVP

**Goal**: Enable users to upload XML files via drag-and-drop and initiate validation.

**Independent Test**: Upload a valid XML file via drag-and-drop and observe the validation process starting and displaying initial progress.

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create `Dropzone` component in `frontend/src/components/Dropzone.tsx`
- [ ] T017 [P] [US1] Implement client-side file size and type validation in `frontend/src/utils/fileUtils.ts`
- [ ] T018 [US1] Integrate `Dropzone` with main application page in `frontend/src/pages/index.tsx`
- [ ] T019 [US1] Implement file reading and Base64 encoding in `frontend/src/utils/fileUtils.ts`
- [ ] T020 [US1] Create frontend service to call `/api/validate` endpoint in `frontend/src/services/validationService.ts`
- [ ] T021 [US1] Implement UI for displaying validation progress states (Uploading, Parsing, Validating...) in `frontend/src/components/ValidationProgress.tsx`
- [ ] T022 [US1] Connect frontend UI to backend validation service and progress display in `frontend/src/pages/index.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Detailed Error Messages (Priority: P1)

**Goal**: Provide users with clear, detailed error messages including line numbers and XML paths.

**Independent Test**: Upload an invalid XML file and verify that error messages are displayed with line numbers, XML paths, and that clicking an error highlights the corresponding XML.

### Implementation for User Story 2

- [ ] T023 [P] [US2] Create `XmlViewer` component with syntax highlighting (using Monaco Editor) in `frontend/src/components/XmlViewer.tsx`
- [ ] T024 [P] [US2] Create `ErrorList` component to display validation issues in `frontend/src/components/ErrorList.tsx`
- [ ] T025 [US2] Implement logic to pass XML content and issues to `XmlViewer` and `ErrorList` in `frontend/src/pages/index.tsx`
- [ ] T026 [US2] Implement click handler in `ErrorList` to scroll/highlight corresponding line in `XmlViewer`
- [ ] T027 [US2] Ensure backend `/api/validate` response includes `xpath` and `lineNumber` for issues in `backend/src/api/validate.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Clear Validation Status (Priority: P1)

**Goal**: Display a prominent and unambiguous validation status to the user.

**Independent Test**: Upload both valid and invalid XML files and verify that a clear "Valid" or "Invalid" badge is displayed, along with a summary of errors/warnings.

### Implementation for User Story 3

- [ ] T028 [P] [US3] Create `ValidationStatusBadge` component in `frontend/src/components/ValidationStatusBadge.tsx`
- [ ] T029 [P] [US3] Create `ValidationSummary` component to display error/warning counts in `frontend/src/components/ValidationSummary.tsx`
- [ ] T030 [US3] Integrate `ValidationStatusBadge` and `ValidationSummary` into the results display in `frontend/src/pages/index.tsx`
- [ ] T031 [US3] Implement logic to generate validation certificate (placeholder for now) in `frontend/src/utils/certificateGenerator.ts`
- [ ] T032 [US3] Add UI element to trigger certificate download for valid invoices in `frontend/src/components/ValidationActions.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Suggested Fixes for Errors (Priority: P2)

**Goal**: Assist users in resolving common validation issues by providing suggested fixes.

**Independent Test**: Upload an XML file with a common error and verify that a "Suggested Fix" is displayed for that error.

### Implementation for User Story 4

- [ ] T033 [P] [US4] Enhance `Issue` data structure in `backend/src/types/validation.ts` to include `suggestion` field.
- [ ] T034 [US4] Implement logic in `backend/src/services/schematronValidator.ts` to provide suggested fixes for common Schematron errors.
- [ ] T035 [US4] Update `ErrorList` component in `frontend/src/components/ErrorList.tsx` to display suggested fixes.

---

## Phase 7: User Story 5 - Exact XML Path for Errors (Priority: P2)

**Goal**: Provide developers with the exact XML path for errors to aid programmatic fixes.

**Independent Test**: Upload an invalid XML file and verify that the XPath for each error is displayed and can be copied.

### Implementation for User Story 5

- [ ] T036 [P] [US5] Ensure `xpath` is consistently extracted and included in `Issue` objects by `backend/src/services/xmlParser.ts` and `backend/src/services/schematronValidator.ts`.
- [ ] T037 [US5] Add "Copy XPath" button/functionality to `ErrorList` component in `frontend/src/components/ErrorList.tsx`.

---

## Phase 8: User Story 6 - Multi-Format Support (Priority: P2)

**Goal**: Allow validation of both UBL and CII invoice formats.

**Independent Test**: Upload both UBL and CII formatted invoices and verify that both are correctly detected and validated.

### Implementation for User Story 6

- [ ] T038 [P] [US6] Implement format detection logic (UBL vs CII) in `backend/src/services/invoiceDetector.ts`.
- [ ] T039 [US6] Update `backend/src/api/validate.ts` to use detected format for selecting appropriate validation rules.
- [ ] T040 [US6] Ensure `frontend/src/services/validationService.ts` can pass `format` parameter if user overrides `auto`.

---

## Phase 9: User Story 7 - Country-Specific Validation (Priority: P2)

**Goal**: Enable validation against country-specific PEPPOL rules.

**Independent Test**: Upload invoices for supported countries (e.g., NO, DE) and verify that country-specific rules are applied and indicated.

### Implementation for User Story 7

- [ ] T041 [P] [US7] Implement country detection logic from invoice data in `backend/src/services/invoiceDetector.ts`.
- [ ] T042 [US7] Update `backend/src/services/peppolArtifacts.ts` to load country-specific Schematron rules.
- [ ] T043 [US7] Update `backend/src/api/validate.ts` to apply country-specific rules based on detected or specified country.
- [ ] T044 [US7] Add UI element for manual country override in `frontend/src/components/ValidationOptions.tsx`.

---

## Phase 10: User Story 8 - Download Validation Reports (Priority: P3)

**Goal**: Allow users to download validation reports for audit trails.

**Independent Test**: Validate an invoice and verify that JSON and HTML reports can be downloaded.

### Implementation for User Story 8

- [ ] T045 [P] [US8] Implement JSON report generation in `backend/src/services/reportGenerator.ts`.
- [ ] T046 [P] [US8] Implement HTML report generation in `backend/src/services/reportGenerator.ts`.
- [ ] T047 [US8] Add UI buttons to download JSON and HTML reports in `frontend/src/components/ValidationActions.tsx`.

---

## Phase 11: User Story 9 - Example Valid Invoices (Priority: P3)

**Goal**: Provide new users with example valid invoices to understand the expected format.

**Independent Test**: Navigate to the examples section and verify that example valid invoices can be viewed and downloaded.

### Implementation for User Story 9

- [ ] T048 [P] [US9] Create a collection of example valid invoices (XML files) in `public/examples/`.
- [ ] T049 [P] [US9] Implement a backend endpoint to serve example invoices in `backend/src/api/examples.ts`.
- [ ] T050 [US9] Create an "Examples" page/section in `frontend/src/pages/examples.tsx` to list and allow download of examples.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Address overall quality, performance, security, and user experience improvements across the application.

- [ ] T060 [P] Implement URL-based file import functionality in `frontend/src/utils/fileUtils.ts` and integrate into `frontend/src/pages/index.tsx`
- [ ] T061 [P] Implement copy shareable validation summary functionality in `frontend/src/components/ValidationActions.tsx`
- [ ] T062 [P] Implement export annotated XML with error comments in `frontend/src/components/ValidationActions.tsx`
- [ ] T063 [P] Implement inline tooltips for technical terms across `frontend/src/components/`
- [ ] T064 Conduct accessibility audit and implement WCAG 2.1 Level AA compliance fixes across `frontend/`
- [ ] T065 [P] Implement responsive design adjustments for various screen sizes in `frontend/src/styles/globals.css` and components.
- [ ] T066 [P] Implement dark/light mode toggle functionality in `frontend/src/components/ThemeToggle.tsx`.
- [ ] T067 Implement keyboard shortcuts for power users (e.g., upload, validate) in `frontend/src/utils/keyboardShortcuts.ts`.
- [ ] T068 Review and implement GDPR compliance best practices across the application.
- [ ] T069 Configure robust CSP headers for `frontend/` to prevent XSS.
- [ ] T070 Conduct comprehensive unit testing for `backend/` services and `frontend/` components, ensuring >80% unit test coverage.
- [ ] T071 Conduct integration testing for frontend-backend communication and validation pipeline.
- [ ] T072 Conduct end-to-end testing for critical user journeys.
- [ ] T073 Refine Vercel deployment pipeline for continuous integration and delivery.

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: No dependencies - can start immediately
-   **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
-   **User Stories (Phase 3+)**: All depend on Foundational phase completion
    -   User stories can then proceed in parallel (if staffed)
    -   Or sequentially in priority order (P1 → P2 → P3)
-   **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

-   **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
-   **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for basic validation flow.
-   **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for basic validation flow.
-   **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for error display.
-   **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for error display.
-   **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for validation initiation.
-   **User Story 7 (P2)**: Can start after Foundational (Phase 2) - Depends on US6 for format detection.
-   **User Story 8 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 for validation results.
-   **User Story 9 (P3)**: Can start after Foundational (Phase 2) - Independent, but typically done later.

### Within Each User Story

-   Tests (if included) MUST be written and FAIL before implementation
-   Models before services
-   Services before endpoints
-   Core implementation before integration
-   Story complete before moving to next priority

### Parallel Opportunities

-   All Setup tasks marked [P] can run in parallel
-   All Foundational tasks marked [P] can run in parallel (within Phase 2)
-   Once Foundational phase completes, multiple user stories can start in parallel (if team capacity allows), respecting inter-story dependencies.
-   All tasks within a user story marked [P] can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
# (No explicit test tasks generated as per prompt, but would go here)

# Launch all parallelizable implementation tasks for User Story 1 together:
Task: "T016 [P] [US1] Create `Dropzone` component in `frontend/src/components/Dropzone.tsx`"
Task: "T017 [P] [US1] Implement client-side file size and type validation in `frontend/src/utils/fileUtils.ts`"
```

---

## Implementation Strategy

### MVP First (User Story 1, 2, 3)

1.  Complete Phase 1: Setup
2.  Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3.  Complete Phase 3: User Story 1
4.  Complete Phase 4: User Story 2
5.  Complete Phase 5: User Story 3
6.  **STOP and VALIDATE**: Test User Stories 1, 2, and 3 independently and together.
7.  Deploy/demo if ready

### Incremental Delivery

1.  Complete Setup + Foundational → Foundation ready
2.  Add User Story 1 → Test independently → Deploy/Demo (MVP Increment 1)
3.  Add User Story 2 → Test independently → Deploy/Demo (MVP Increment 2)
4.  Add User Story 3 → Test independently → Deploy/Demo (MVP Increment 3)
5.  Continue with P2 and P3 stories incrementally.
6.  Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1.  Team completes Setup + Foundational together.
2.  Once Foundational is done:
    -   Developer A: User Story 1
    -   Developer B: User Story 2 (after US1 is sufficiently progressed for error data)
    -   Developer C: User Story 3 (after US1 is sufficiently progressed for validation status)
    -   Developer D: User Story 6 (can be parallel with US1, US2, US3)
3.  Stories complete and integrate independently, respecting dependencies.

---

## Notes

-   [P] tasks = different files, no dependencies
-   [Story] label maps task to specific user story for traceability
-   Each user story should be independently completable and testable
-   Verify tests fail before implementing
-   Commit after each task or logical group
-   Stop at any checkpoint to validate story independently
-   Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence