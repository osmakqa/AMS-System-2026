# Design and Development Change Log (ISO 9001:2015 Clause 8.3.6)

**Project:** Osmak Antimicrobial Stewardship (AMS) System

---

| Version | Date | Description of Change | Reason for Change | Review/Auth By |
| :--- | :--- | :--- | :--- | :--- |
| **v1.0** | 2024-01-01 | **Initial Release** | Replacement of paper-based antimicrobial request forms. Basic CRUD functionality. | AMS Committee Head |
| **v1.1** | 2024-01-15 | **Role-Based Access Control (RBAC)** | Implementation of distinct views and permissions for Pharmacists, IDS, and AMS Admins. | IT Head |
| **v1.2** | 2024-02-01 | **Supabase Integration** | Transition to cloud database for real-time data persistence and multi-user access. | IT Head |
| **v1.3** | 2024-02-15 | **Restricted vs. Monitored Logic** | Implemented workflow branching: Restricted drugs must be forwarded to IDS; Monitored drugs approved by Pharmacy. | AMS Committee Head |
| **v1.4** | 2024-03-01 | **AI Clinical Guardrails** | Integration of Gemini API for Real-time Renal Dosing checks and Pediatric Dosing verification. | QA Head / AMS Head |
| **v1.5** | 2024-03-15 | **Analytics Dashboard** | Added "Data Analysis" tab for AMS Admins with utilization charts, IDS turnaround times, and export features. | AMS Committee Head |
| **v1.6** | 2024-04-01 | **Public Request Portal** | Added "Submit New Request" button on login page for Residents to submit without full account access. | IT Head |
| **v1.7** | 2024-04-15 | **AMS Audit Tool & Structured Findings** | <ul style="margin:0;padding-left:15px;"><li>**Audit Tool Upgrade:** Full digitisation of AMS Audit form with AI Guardrails and Auto-eGFR.</li><li>**Structured Findings:** Added "Click-to-Comment" findings for Pharmacists reviewing requests.</li><li>**General Notes:** Implemented "General Audit Note" for high-level audit summaries.</li><li>**UI/UX:** Enhanced modal layering (z-index) and removed redundant "Edit Original Data" actions.</li></ul> | AMS Committee Head / IT Head |
| **v1.8** | 2024-05-01 | **Resident Dashboard & Analytics** | <ul style="margin:0;padding-left:15px;"><li>**Resident Module:** Dedicated dashboard for Residents to view Disapproved requests.</li><li>**Edit & Resend:** Capability for Residents to correct and resubmit requests (Reset to Pending).</li><li>**Pharmacy Analytics:** Added Data Analysis tab for Pharmacists.</li><li>**Security:** Implemented role-specific and name-based password policies.</li></ul> | AMS Committee Head |

---
*This log controls changes made during or subsequent to the design and development of products and services.*