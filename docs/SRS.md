
# Software Requirements Specification (SRS) (ISO 9001:2015 Clause 8.3.3)

**Project:** Osmak AMS System
**Version:** 1.9

---

## 1. Introduction
This document defines the requirements for the Osmak AMS System, an application designed to manage the authorization of antimicrobial prescriptions and facilitate clinical auditing within the hospital.

## 2. Functional Requirements

### 2.1 User Roles & Access
*   **Resident / Physician:**
    *   **Public Access:** Can submit new requests via the public portal form (without logging in).
    *   **Dashboard Access:** Can log in to a dedicated dashboard to view their own "Disapproved" requests.
    *   **Edit & Resend:** Can modify their previously disapproved requests and resubmit them, which resets the status to `PENDING` for re-review.
*   **Pharmacist:**
    *   View "Pending" requests.
    *   View "Approved", "Disapproved", and "For IDS Approval" requests in a searchable **History** tab.
    *   **Advanced Filtering:** Can filter history by antimicrobial drug names and perform global searches on patient identity or request dates.
    *   **Monitored Drugs:** Can Approve or Disapprove.
    *   **Restricted Drugs:** Must Forward to IDS (`FOR_IDS_APPROVAL`).
    *   **Review Findings:** Can add structured findings (e.g., "Wrong Dose", "Wrong Duration") to request records during review.
    *   **Analytics:** Access to Pharmacy-specific data analysis charts.
*   **Infectious Disease Specialist (IDS):**
    *   View requests forwarded by Pharmacy (`FOR_IDS_APPROVAL` status).
    *   Approve or Disapprove Restricted drugs.
    *   Can add structured findings during their review.
*   **AMS Admin / Auditor:**
    *   Full "Data Analysis" dashboard with comprehensive metrics.
    *   Can view all "Restricted", "Monitored", and "All" requests.
    *   **AMS Audit Tool:** Can create, edit, and view clinical audits.
    *   **General Audit Note:** Can add/edit a free-text "General Audit Note" for high-level audit summaries directly within the audit record.

### 2.2 Clinical Decision Support (AI)
*   **Renal Guardrail:** Automated alert if patient's eGFR conflicts with the drug's renal dosing monograph.
*   **Pediatric Guardrail:** Automated verification of `mg/kg` dose safety based on patient weight and age against pediatric monographs.
*   **Weight-Based Check:** Automated verification for adult weight-based dosing if applicable (e.g., Vancomycin loading dose).

### 2.3 Workflow Logic
1.  **Submission:** All new requests initiate with `PENDING` status.
2.  **Pharmacy Review (Initial):**
    *   Drug classified as `Monitored` -> Pharmacist can directly `APPROVE` or `DISAPPROVE`.
    *   Drug classified as `Restricted` -> Pharmacist must `FORWARD_IDS` (status becomes `FOR_IDS_APPROVAL`).
3.  **IDS Review (Restricted Only):**
    *   Requests with status `FOR_IDS_APPROVAL` are reviewed by an IDS.
    *   IDS can then `APPROVE` or `DISAPPROVE`.
4.  **Resubmission Loop (Disapproved):**
    *   If a request is `DISAPPROVED`, the initiating Resident can view the reason(s).
    *   The Resident can `EDIT` the request details and `RESEND` it. Resending resets the status to `PENDING` and clears previous approval/disapproval dates and findings, allowing a fresh review cycle.

### 2.4 Data Analysis & Reporting
*   Dedicated Dashboards for AMS Admin and Pharmacists.
*   Key Metrics tracked: Total request volume, approval rates, average turnaround time (Pharmacy & IDS), top prescribed drugs, intervention statistics (findings distribution).
*   Ability to export filtered data to CSV format from modal views.

### 2.5 AMS Audit Tool & Monitoring
*   Provides a structured form for retrospective clinical auditing.
*   **AMS Monitoring Log:** A real-time flowsheet for tracking patient administration days (DOT).
*   **Interactive Log:** Clicking cells allows marking doses as "Given" or "Missed" with immediate data synchronization.
*   **Custom Verification:** Actions such as "Undo Status" require confirmation via a custom-styled dialog.

## 3. Data Integrity & Security
*   **Credential Management:** User credentials are role-based and managed by a system administrator. Password policies are implemented (e.g., `lastname123`, `doctor123`).
*   **Audit Trail:** The system records actions, timestamps, and active users where applicable (e.g., `dispensed_by`, `id_specialist`).
*   **Persistence:** Supabase cloud database ensures data persistence and real-time synchronization.

---
**Verified By:** _________________________ (Project Lead)
**Date:** 2024-05-15
