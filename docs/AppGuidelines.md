
# Ospital ng Makati Antimicrobial Stewardship (AMS) System Guidelines

**Document Version:** 1.1  
**Effective Date:** May 2024  
**Applies To:** All Medical, Pharmacy, and Nursing Staff involved in Antimicrobial Prescribing.

---

## 1. Introduction
The **Osmak AMS System** is a centralized digital platform designed to optimize antimicrobial use within the institution. It facilitates the **electronic requesting and authorization** of antimicrobial prescriptions, replacing manual paper-based forms with a streamlined, role-based approval workflow.

## 2. Scope and Objectives

### 2.1 Scope
This guideline covers the protocol for **requesting** and **approving** the following categories of antimicrobials:
*   **Restricted Antimicrobials:** High-cost, broad-spectrum, or last-line agents requiring Infectious Disease Specialist (IDS) approval (e.g., Meropenem, Vancomycin, Colistin).
*   **Monitored Antimicrobials:** Agents that require surveillance by Clinical Pharmacists to prevent misuse (e.g., Ceftriaxone, Levofloxacin).

### 2.2 Objectives
1.  **Patient Safety:** Minimize medication errors through AI-powered dosing guardrails (Renal & Pediatric) at the point of request.
2.  **Rational Use:** Ensure the "Right Drug, Right Dose, Right Duration, Right Route" via mandatory indication documentation.
3.  **Efficiency:** Reduce turnaround time for approvals compared to paper referrals.
4.  **Accountability:** Digitally track the prescriber, reviewer, and approver for every restricted antimicrobial order.

---

## 3. User Roles & Responsibilities

| Role | Responsibilities |
| :--- | :--- |
| **Resident / Physician** | • Initiate requests with accurate patient demographics and clinical data.<br>• Provide justification (Diagnosis/Indication) for antimicrobial use.<br>• Monitor the "Resident Dashboard" for Disapproved requests.<br>• Edit and resubmit requests based on reviewer findings. |
| **Clinical Pharmacist** | • First-line reviewer for **all** requests.<br>• **Approve/Disapprove** Monitored antimicrobials.<br>• **Validate & Forward** Restricted antimicrobials to IDS.<br>• Verify dosing against renal function and weight using system guardrails. |
| **ID Specialist (IDS)** | • Final approver for **Restricted** antimicrobials forwarded by Pharmacy.<br>• Review clinical justification and microbiology results.<br>• Provide expert recommendations via structured findings/comments. |
| **AMS Admin** | • Oversee system compliance.<br>• Analyze request volume, approval rates, and turnaround times. |

---

## 4. Operational Guidelines

### 4.1 Request Submission
*   **Mandatory Fields:** All requests require complete patient demographics (including weight for dosing checks), current serum creatinine (SCr) for eGFR calculation, and a specific indication.
*   **Pediatric Patients:** Height is **mandatory** for pediatric patients to facilitate accurate Bedside Schwartz eGFR calculation.
*   **Urgency:** Requests should be submitted as early as possible during rounds to ensure timely review.

### 4.2 AI Clinical Guardrails (Decision Support)
The system integrates Google Gemini AI to provide real-time safety checks during the request process.
*   **Disclaimer:** AI alerts (Renal Dosing, Pediatric Safety, Weight-Based Checks) are **advisory only**. They act as a "second pair of eyes" but do **not** replace clinical judgment.
*   **Action:** If an alert appears (e.g., "Renal Dosing Alert: Reduce dose to..."), the prescriber **must** verify the recommendation against the patient's clinical status before proceeding.

### 4.3 Approval Workflow
The system utilizes a status-based workflow:

1.  **Pending:** Request submitted by Resident. Visible to Pharmacists for initial review.
2.  **For IDS Approval:** Pharmacist has reviewed a *Restricted* drug and forwarded it to the IDS queue.
3.  **Approved:** Drug is authorized for dispensing.
4.  **Disapproved:** Request rejected by Pharmacy or IDS.
    *   **Correction Process:** If Disapproved, the requesting Resident must log in, view the "Reason for Disapproval" (e.g., "Wrong Dose", "De-escalation needed"), edit the request details, and click **"Update & Resend"** to restart the process.

---

## 5. Clinical Policies

### 5.1 Renal Dosing
*   The system uses **CKD-EPI (2021)** for adults and **Bedside Schwartz** for pediatrics to calculate eGFR automatically.
*   Dosing adjustments should be based on the calculated eGFR provided by the system at the time of request, unless the patient is on dialysis/CRRT, in which case specific dialysis dosing protocols apply.

### 5.2 Restricted Drug Accountability
*   Prescriptions for Restricted drugs require the name of the **Service Resident** (IM/Pedia) and the **consulting ID Specialist** to be recorded in the request form. This ensures accountability and confirms that a specialist consultation has occurred or is planned.

---

## 6. Data Privacy & Security
*   **Confidentiality:** Patient data (Name, Hospital Number) is sensitive. Access is restricted to authorized hospital staff only.
*   **Credential Security:** Users must not share passwords.
*   **Audit Trails:** All actions (Approve, Disapprove, Edit) are timestamped and logged with the user's identity.

## 7. Support
For system errors ("Database Error", login issues) or clinical disputes regarding monograph recommendations, please contact the **AMS Committee Head** or the **Infection Prevention & Control (IPC) Department**.
