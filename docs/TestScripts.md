# Verification Record - Test Scripts (ISO 9001:2015 Clause 8.3.4)

**Project:** Osmak Antimicrobial Stewardship (AMS) System
**Test Date:** 2024-05-01
**Tester:** [Insert Name]

---

| Test ID | Feature Tested | Description / Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **TC-001** | **New Request (Public Portal)** | Click "Submit New Antimicrobial Request". Fill form (Adult, Meropenem, eGFR=90). Click Submit. | System alerts "Antimicrobial Request submitted successfully!". Entry appears in DB with `PENDING` status. | |
| **TC-002** | **Renal AI Alert (Request Form)** | Create Request. Select "Meropenem". Enter SCr = 4.0 mg/dL (low eGFR). | Yellow Warning Banner appears: "Renal Dosing Alert" with a relevant recommendation. | |
| **TC-003** | **Pediatric Guardrail (Request Form)** | Select "Pediatric". Wt=10kg, Age=6mo, Ht=60cm. Drug="Vancomycin". Dose="500mg" (High). | Yellow Warning Banner appears: "Dosing Caution" with message indicating potential overdose. | |
| **TC-004** | **Pharmacist - Monitored Approval** | Login as Pharmacist. Find Pending "Ceftriaxone" (Monitored). Click Approve. | Status changes to `APPROVED`. `dispensed_by` and `dispensed_date` are recorded. Request moves to Approved tab. | |
| **TC-005** | **Pharmacist - Restricted Forward** | Login as Pharmacist. Find Pending "Meropenem" (Restricted). Click "For IDS Approval". | Status changes to `FOR_IDS_APPROVAL`. `dispensed_by` and `dispensed_date` are recorded. Request moves from Pending to "For IDS Approval" tab (visible to IDS). | |
| **TC-006** | **IDS Workflow - Approval** | Login as IDS. Find the forwarded "Meropenem". Click Approve. | Status changes to `APPROVED`. `id_specialist` and `ids_approved_at` are recorded. Request moves from Pending tab. | |
| **TC-007** | **Disapproval Logic - Pharmacist** | Login as Pharmacist. Find a Monitored drug. Click Disapprove. Select Reason "Wrong Dose". Enter remarks. Confirm. | Status changes to `DISAPPROVED`. `disapproved_reason` and `dispensed_date` (Pharmacist) are saved. Request moves to Disapproved tab. | |
| **TC-008** | **Resident Dashboard - View Disapproved** | Login as Resident. Navigate to "Disapproved" tab. | All previously disapproved requests associated with Resident role are displayed. | |
| **TC-009** | **Resident - Edit & Resend** | Login as Resident. Select a disapproved request. Click "Edit". Modify a field (e.g., dose). Click "Update & Resend". | System alerts "Request Updated and Resent successfully!". Status resets to `PENDING`. `dispensed_date`, `disapproved_reason`, `ids_approved_at`, `ids_disapproved_at`, and `findings` are cleared. |
| **TC-010** | **Admin Dashboard - Data Analysis** | Login as AMS Admin. Click "Data Analysis". Filter by Month/Year. | Charts update dynamically based on filters. KPI cards show correct counts. |
| **TC-011** | **CSV Export (Chart Detail)** | Open "All Requests" modal from a chart. Click "Export to CSV". | Browser downloads `.csv` file with correct request data and headers. |
| **TC-012** | **AMS Audit Form - Basic Submission** | Login as AMS Admin. Open "New Audit". Fill Audit Info (Auditor, Area, Date, Shift) and Patient Info (Hosp No, DOB, Sex, Weight, SCr). Add at least one Antimicrobial with all required fields. Click "Review Audit", then "Confirm Submission". | Audit successfully created, appears in `AMSAuditTable`. |
| **TC-013** | **AMS Audit Form - Renal AI Alert** | Login as AMS Admin. Open "New Audit". In Antimicrobial #1, select "Cefepime". In Patient Info, set patient mode to 'adult', enter Age (e.g., 70), Sex ('Female'), Weight (e.g., 60), SCr (e.g., 200 µmol/L). In Antimicrobial #1, enter Dose (e.g., '2g'), Freq ('q8h'). | A yellow "Renal Guardrail" alert appears under Antimicrobial #1 with a relevant recommendation based on eGFR calculation. |
| **TC-014** | **AMS Audit Form - Pediatric Dosing AI Alert** | Login as AMS Admin. Open "New Audit". Set patient mode to 'pediatric'. In Patient Info, enter Wt=5kg, Age=6mo, Ht=60cm, SCr=30. In Antimicrobial #1, select "Vancomycin". Enter Dose='500mg', Freq='q6h'. | A yellow "Pediatric Safety" alert appears under Antimicrobial #1 with a message indicating potential overdose. |
| **TC-015** | **AMS Audit Detail - General Note Edit** | Login as AMS Admin. Click "Review" on an existing audit in `AMSAuditTable`. Enter text in the "Edit General Audit Notes" textarea. Click "Save Note". | A success alert appears. The note is saved and persists if the modal is closed and re-opened. The note appears in `AMSAuditSummary`. |
| **TC-016** | **Pharmacist - Data Analysis Access** | Login as Pharmacist. Verify "Data Analysis" tab is visible and accessible. | "Data Analysis" tab is present and displays relevant pharmacy-specific charts. |

---
**Overall Test Result:**
[ ] Passed
[ ] Failed

**Tester Signature:** _________________________
**Date:** 2024-05-01