# Osmak AMS System - User Manual

## **1. System Overview**
The **Osmak Antimicrobial Stewardship (AMS) System** is a digital platform designed to streamline the request, review, and approval process for antimicrobial prescriptions. It ensures patient safety through AI-powered guardrails and enforces hospital policy regarding Restricted and Monitored drugs.

---

## **2. Getting Started**

### **System Access**
The system is accessible via web browser. The login screen provides role-based access and quick-action buttons for common tasks.

*   **View System Workflow:** Click this link at the bottom of the login screen to see a visual diagram of the prescription approval process and status lifecycles.
*   **View User Manual:** Click this link to open this documentation at any time.

### **Login Credentials**
Log in using the credentials provided by the AMS Committee or IT Department. Passwords are case-sensitive and typically follow a predictable format (all lowercase).

| User Role | Password Format | Example |
| :--- | :--- | :--- |
| **Resident** | `doctor123` | `doctor123` |
| **Pharmacist** | `[lastname]123` | `abello123` |
| **ID Specialist** | `[lastname]456` | `tibayan456` |
| **AMS Admin** | `ams123` | `ams123` |

---

## **3. Guide for Residents & Physicians**

### **Option A: Submit Request (No Login)**
1.  Go to the Login Page.
2.  Click the large button: **"Submit New Antimicrobial Request"**.
3.  **Patient Info**: Enter Name, ID, Age, Weight. *Note: For Pediatrics, Height is required for eGFR calculation.*
4.  **Clinical Data**: Enter Diagnosis, Indication, and Lab results (SCr).
    *   *AI Feature:* Watch for **Renal Dosing Alerts** if eGFR is low, or **Pediatric Dosing Alerts** if a pediatric patient's dose seems outside the recommended range.
5.  **Medication**: Select the Antimicrobial. The system will auto-classify it as Monitored or Restricted.
    *   **Monitored Drugs**: Reviewed by Pharmacy.
    *   **Restricted Drugs**: Require an ID Specialist name to be selected.
6.  **Micro & History**: Enter previous antibiotics and isolated organisms/specimens if available.
7.  **Submit**: Click "Submit Request".

### **Option B: Resident Dashboard (Login)**
1.  Select the **"Resident"** tab on the login screen.
2.  Enter your assigned password.
3.  **Disapproved Requests**: Your dashboard displays all your requests that were rejected by Pharmacy or IDS.
    *   Use the **Month** and **Year** filters to narrow down the list.
    *   Click on a disapproved request card to view detailed information, including any **Review Findings** added by the reviewing pharmacist or IDS specialist.
4.  **Edit & Resend**:
    *   On a disapproved request card, click the blue **"Edit"** button.
    *   The Antimicrobial Request Form will open with your previous data pre-filled.
    *   Review the **Reason for Disapproval** in the details and make the necessary corrections (e.g., adjust dose, change drug, add more clinical justification).
    *   Click **"Update & Resend"**. The request will be re-queued as **PENDING** for a fresh review. Any previous approval/disapproval dates and findings will be cleared.

---

## **4. Guide for Pharmacists**

### **Reviewing Requests**
1.  Log in as a **Pharmacist**. Your default view is the **"Pending"** tab showing all new requests awaiting your review.
2.  Click any request card to view its comprehensive details, including the AI-powered monograph.

### **Taking Action**
*   **Monitored Drugs:**
    *   You can directly **Approve** or **Disapprove** the request.
    *   If disapproving, you will be prompted to select a reason and add details.
*   **Restricted Drugs:**
    *   You cannot directly approve/disapprove Restricted drugs. You must click **"For IDS Approval"** to forward the request to the Infectious Disease Specialist for their final review.
*   **AI Clinical Guardrails:**
    *   The system automatically performs **Renal Dosing Alerts**, **Pediatric Dosing Checks**, and **Weight-Based Dosing Checks** within the detail view. Review these alerts carefully.
*   **Review Findings:**
    *   In the detail view, you can click on specific sections of the patient's information (e.g., "Medication Request", "Clinical Data") on the left pane to activate the "Review Findings" panel on the right.
    *   Select a category (e.g., "Wrong Dose", "No Infection") and add specific details. These structured findings will be recorded and visible to the requesting Resident if the request is disapproved.
    *   You can **"Save Findings"** at any point, even if you are not immediately approving or disapproving, to document your review notes.

### **Data Analysis**
*   Click the **"Data Analysis"** tab to view your performance metrics.
*   This dashboard provides insights into:
    *   Your total handled requests.
    *   Average time taken for your first action.
    *   Top performing pharmacists by activity.
    *   Breakdown of your approval, disapproval, and forwarded decisions.
    *   Distribution of intervention findings you've logged.

---

## **5. Guide for ID Specialists (IDS)**

1.  Log in as **IDS**.
2.  Your **"Pending"** tab contains only Restricted drugs that have been forwarded by a Pharmacist and are awaiting your final decision.
3.  Click on a request card to review all clinical details, including any previous findings added by the Pharmacist.
4.  Click **Approve** or **Disapprove** to finalize the request. If disapproving, you will be prompted to select a reason and add details.

---

## **6. Guide for AMS Admins / Auditors**

### **Option A: Quick Audit Tool (No Login)**
1.  On the Login Page, select the **"AMS"** tab.
2.  Click the **"AMS Audit Tool"** button that appears below the login form.
3.  This opens the **New Audit Form** immediately, allowing for rapid data entry during clinical rounds without navigating the full dashboard.
    *   *Note:* Ensure you select your name in the "Auditor" dropdown manually.

### **Option B: Full Dashboard Access (Login)**
*   Log in as **AMS**. The default tab opens to the comprehensive **"Data Analysis"** dashboard.
*   **Filters:** Use the **Month** and **Year** dropdowns to filter data. You can also filter by **Patient Mode** (Adult/Pediatric).
*   **Charts:** View overall request volume, approval rates, breakdown of restricted vs. monitored drugs, top antimicrobials, pharmacy performance metrics, and IDS turnaround times.
*   **Export:** Click on any chart title to open a modal displaying the underlying data. From this modal, you can click **"Export to CSV"** to download the raw data for further analysis.

### **Managing Audits**
1.  Click the **"AMS Audit"** tab inside the dashboard. This displays a table of all past audit records.
2.  **New Audit:** Click the **"New Audit"** button (if not using the Quick Tool).
    *   Fill in **Audit Information** (Auditor, Area, Date, Shift).
    *   Enter **Patient Information** (Hospital No., DOB, Sex, Weight, SCr). The system will **auto-calculate eGFR** based on the patient's age (from DOB), sex, weight, height (if pediatric), and SCr.
    *   Document **Diagnostics & Biomarkers** and **Recent History**.
    *   For each of up to 5 **Antimicrobials** administered, select its class, drug, dosing, route, and detailed indication codes (Diagnosis Type, System/Site, Sub-site, Indication Category, Sub-Category, Specific Type).
    *   **AI Guardrails:** As you enter drug and patient data for each antimicrobial, the system automatically provides **Renal Dosing Alerts**, **Pediatric Safety Warnings**, and **Adult Weight-Based Dosing Warnings** to assist in your review.
    *   Fill out **Microorganisms & Resistance** if applicable.
    *   **General Audit Note:** Use the dedicated text area to add a high-level summary or general observations about the audit case.
    *   **Review & Submit:** Review the audit summary, then confirm submission.
3.  **Manage Audit Logs:**
    *   From the AMS Audit table, click **"Review"** on any record to view its full details in a modal.
    *   In the detail view, you can use the **"Edit General Audit Notes"** section to update the high-level summary. Click **"Save Note"** to persist your changes.
    *   Click **"Edit"** on any record in the table to reopen the full audit form for modification.

---

## **7. Troubleshooting**
*   **"Database Error"**: This indicates an issue with the application's connection to the database. Please contact IT support (e.g., IPC department) immediately.
*   **"Loading..." hangs**: If the application remains stuck on a loading screen, try refreshing the page. Ensure you have a stable internet connection.
