# Design and Development Plan (ISO 9001:2015 Clause 8.3.2)

**Project Title:** Osmak Antimicrobial Stewardship (AMS) System
**Department:** Pharmacy / Infectious Disease / IT
**Date Prepared:** 2024-05-01

---

## 1. Objective
To develop a centralized, web-based decision support system that regulates the prescription of Restricted and Monitored antimicrobials. This ensures compliance with **DOH/PhilHealth AMS standards** and promotes rational antimicrobial use to combat resistance.

## 2. Development Stages

### Phase 1: Planning & Requirements Gathering
*   **Input:** Review of current "Antimicrobial Request Form" (Paper).
*   **Activity:** Consultation with AMS Committee to define the list of Restricted vs. Monitored drugs.
*   **Output:** Software Requirements Specification (SRS) defining the approval workflow.

### Phase 2: Design & Prototyping
*   **Activity:** Creation of UI wireframes for the "Request Modal" and "Pharmacist Dashboard".
*   **Activity:** Database schema design (Supabase table: `requests`).
*   **Review:** Approval of the "Forward to IDS" logic by the ID Section Head.

### Phase 3: Development / Coding
*   **Frontend:** ReactJS with TailwindCSS for responsive clinical UI.
*   **Backend:** Supabase for database, authentication, and real-time subscriptions.
*   **AI Integration:** Implementation of Google Gemini for:
    *   Renal Dosing Guardrails (eGFR analysis).
    *   Pediatric Dosing Verification (Weight-based checks).
    *   Weight-Based Dosing for Adult Restricted Drugs (Weight-based checks).
    *   Monograph retrieval.
*   **New Features:**
    *   Resident Dashboard for Disapproved requests and Edit/Resend functionality.
    *   Pharmacist-specific analytics dashboard.
    *   AMS Audit Tool enhancements, including 'General Audit Note'.

### Phase 4: Verification (Testing)
*   **Activity:** Unit testing of eGFR calculators (CKD-EPI / CKiD).
*   **Activity:** Execution of Test Scripts (See `TestScripts.md`) covering the full lifecycle of a prescription and audit processes.
*   **Activity:** Testing of Resident Edit & Resend workflow.
*   **Activity:** Verification of new analytics for Pharmacists and AMS Admin.

### Phase 5: Validation & Deployment
*   **Activity:** User Acceptance Testing (UAT) by Pharmacy Department, Medical Residents, and AMS Committee.
*   **Output:** Go-Live and integration into daily hospital rounds.

## 3. Responsibilities and Authorities
*   **Project Lead / Developer:** Code architecture, AI implementation, and security.
*   **Process Owner (AMS Head):** Definition of clinical guidelines (monographs) and approval workflows.
*   **End Users (Pharmacists/IDS/Residents/AMS Admin):** Validation of workflow efficiency and data accuracy.

## 4. Resources
*   **Hardware:** Hospital workstations, Mobile devices (for IDS rounds).
*   **Software:** Visual Studio Code, Supabase (Cloud DB), Google Gemini API.
*   **Reference Standards:** Sanford Guide, Local Hospital Antibiogram.

---
**Prepared By:** _________________________ (Developer)
**Approved By:** _________________________ (AMS Committee Head)