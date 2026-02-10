import { DrugType } from '../types';

export interface DrugMonograph {
  restricted: boolean;
  spectrum: string;
  dosing: string;
  renal: string;
  hepatic: string;
  duration: string;
  monitoring: string;
  warnings?: string;
  ams?: string;
  weightBased?: boolean;
  restriction?: DrugType; // Legacy support
}

export const ADULT_MONOGRAPHS: { [key: string]: DrugMonograph } = {
  // ======================================
  //            RESTRICTED ADULT
  // ======================================
  "Acyclovir IV": {
    restricted: true,
    spectrum: "Active vs HSV-1, HSV-2, and VZV; no activity vs CMV.",
    dosing: "5–12.5 mg/kg IV q8h (normal renal function). Serious HSV/VZV CNS infections typically 10–12.5 mg/kg q8h. Dose uses actual body weight unless obese—then see obesity dosing adjustments.",
    renal: "CrCl >50: no change. CrCl 10–50: 5–12.5 mg/kg IV q12–24h. CrCl <10: 2.5–6.25 mg/kg IV q24h. Hemodialysis/CAPD/CRRT: 2.5–6.25 mg/kg IV q24h (dose after dialysis for HD). Rapid infusion increases risk of nephrotoxicity due to crystalluria.",
    hepatic: "No required dose adjustment in mild to severe hepatic impairment (Child-Pugh A–C); data limited.",
    duration: "Varies by syndrome: serious HSV/VZV/CNS disease usually 10–14 days; encephalitis may require extended courses per clinical guidance.",
    monitoring: "Renal function (SCr trends), hydration status, neurotoxicity (confusion, hallucinations, delirium, seizures), urine output. Watch for phlebitis and renal crystallization.",
    warnings: "Risk of obstructive uropathy from crystal precipitation—avoid rapid infusion and dehydration. Neurotoxicity more common with renal impairment. IV infiltration causes local tissue injury.",
    ams: "Restricted. Use for severe HSV/VZV disease (e.g., encephalitis, disseminated disease, immunocompromised hosts). Transition to oral therapy or de-escalate when diagnosis is excluded or patient improves.",
    weightBased: true
  },
  "Amikacin": {
    restricted: true,
    spectrum: "Aminoglycoside with potent Gram-negative activity; covers Enterobacterales and some non-fermenters but no longer recommended for non-urinary Pseudomonas. Active against susceptible mycobacteria (NTM).",
    dosing: "Extended-interval: 15–20 mg/kg IV q24h for typical Gram-negative infections. Conventional: 7.5 mg/kg IV q12h. For NTM: 10–15 mg/kg IV/IM q24h (or 15–25 mg/kg 3× weekly depending on regimen).",
    renal: "CrCl >50: usual dosing. CrCl 10–50: 7.5 mg/kg IV q24h (conventional). CrCl <10: 7.5 mg/kg IV q48h. ESRD: q48h with supplemental dose on dialysis days. For CRRT: extended-interval 25 mg/kg q48h. Requires TDM for peaks/troughs or AUC guidance.",
    hepatic: "No dosage adjustment required across Child-Pugh A–C; hepatically safe.",
    duration: "Typically 5–7 days for Gram-negative infections; avoid prolonged monotherapy. Duration for NTM depends on regimen and species.",
    monitoring: "Serum drug levels (peak/trough or AUC), renal function, urine output, vestibular/cochlear function. Closely monitor for nephrotoxicity and ototoxicity. Watch for neuromuscular blockade in susceptible patients.",
    warnings: "High risk of nephrotoxicity and ototoxicity. Avoid with other nephrotoxic/ototoxic agents (e.g., amphotericin B, cisplatin, vancomycin, colistin). Possible neuromuscular blockade. Liposome inhalation form carries pulmonary toxicity risks but not relevant to IV form.",
    ams: "Restricted; reserve for serious Gram-negative infections or as part of NTM regimens. De-escalate as soon as cultures allow.",
    weightBased: true
  },
  "Aztreonam": {
    restricted: true,
    spectrum: "Active vs Enterobacterales, Pseudomonas aeruginosa, and other Gram-negative aerobes; no activity vs Gram-positive organisms or anaerobes.",
    dosing: "Usual adult: 2 g IV q6–8h (infused over 30 min). For resistant G-negatives per AMR guidance: 3-hour infusions may be preferred. Max 8 g/day.",
    renal: "CrCl ≥30: no adjustment. CrCl 10–<30: reduce dose by 50%. CrCl <10: 1–2 g IV q24h. Hemodialysis: 1–2 g q24h (give dose after dialysis). CRRT: 1–2 g q12h depending on modality.",
    hepatic: "No dosage adjustment required across Child-Pugh A–C.",
    duration: "Varies by infection but typically 7–14 days for Gram-negative disease.",
    monitoring: "Renal function, hypersensitivity reactions, CBC (risk of neutropenia, eosinophilia, thrombocytopenia), LFTs, and CNS effects in high doses or renal impairment.",
    warnings: "Cross-reactivity is rare but possible with ceftazidime or cefiderocol due to identical R-1 side chain. Beware of seizures in renal impairment. GI toxicity and C. difficile possible.",
    ams: "Restricted; preferred for Gram-negative coverage in patients with severe β-lactam allergy, except when ceftazidime side-chain allergy is present.",
    weightBased: false
  },
  "Cefepime": {
    restricted: true,
    spectrum: "Fourth-generation cephalosporin active vs MSSA, H. influenzae, Neisseria spp., and broad Gram-negative bacilli including Pseudomonas aeruginosa.",
    dosing: "Usual: 1–2 g IV q8–12h. Severe infections/PSA: 2 g IV q8h. High-dose regimens needed for ESBL-producing GNB, but carbapenems remain preferred.",
    renal: "Adjust when CrCl ≤60 mL/min. 30–60: 2 g q12h; 11–29: 2 g q24h; <10: 1 g q24h. Neurotoxicity risk increases with renal impairment.",
    hepatic: "No dosage adjustment required across Child-Pugh A–C.",
    duration: "Typically 7–14 days depending on infection.",
    monitoring: "Renal function; mental status for neurotoxicity (confusion, myoclonus, seizures, NCSE).",
    warnings: "Neurotoxicity risk—especially if renally impaired or underdosed adjustments. Can cause C. difficile, positive Coombs, cytopenias.",
    ams: "Restricted for Pseudomonas, severe GNB infections, or when broad Gram-negative coverage is needed.",
    weightBased: false
  },
  "Ceftazidime–Avibactam (NF)": {
    restricted: true,
    spectrum: "Active vs ESBL, AmpC, and KPC-producing Enterobacterales; active vs many MDR GNB including Pseudomonas. Not active vs metallo-β-lactamases or organisms with efflux/porin resistance.",
    dosing: "2.5 g IV q8h infused over 2 hours. Consider 3-hour infusions for AMR targets.",
    renal: "Adjust if CrCl ≤50 mL/min: 31–50: 1.25 g q8h; 16–30: 0.94 g q12h; 6–15: 0.94 g q24h; ≤5: 0.94 g q48h. For CVVH: 1.25 g q8h; CVVHDF: 2.5 g q8h.",
    hepatic: "No dosage adjustment across Child-Pugh A–C.",
    duration: "Typical 7–14 days for cUTI, cIAI (with metronidazole), and HAP/VAP; may extend for MDR/CRE infections.",
    monitoring: "Renal function; monitor for neurotoxicity (ceftazidime component).",
    warnings: "Cross-reactivity possible with ceftazidime, aztreonam, and cefiderocol (shared R1 side chain). Reserve use for KPC/ESBL/MDR GNB; not effective vs MBL producers.",
    ams: "Restricted; use only for documented or strongly suspected CRE (KPC+), ESBL, AmpC, or MDR Pseudomonas.",
    weightBased: false
  },
  "Ceftolozane–Tazobactam (NF)": {
    restricted: true,
    spectrum: "Highly active vs MDR Pseudomonas aeruginosa; strong Gram-negative coverage including ESBL-producing Enterobacterales; limited Gram-positive and minimal anaerobic activity.",
    dosing: "1.5 g IV q8h for cUTI/cIAI. For HAP/VAP: 3 g IV q8h. Infuse over 1 hr (or 3 hr per AMR guidance for severe MDR infections).",
    renal: "Adjust if CrCl ≤50 mL/min: 30–50: 750 mg q8h; 15–29: 375 mg q8h; <15 or on HD: specialized dosing required. For HAP/VAP: use doubled doses (1.5 g → 750 mg → 450 mg equivalents).",
    hepatic: "No dosage adjustment required across Child-Pugh A–C.",
    duration: "cUTI 7–14 days; cIAI 5–14 days; HAP/VAP 7–14 days.",
    monitoring: "Renal function; GI effects; hypersensitivity; neuro status if renal impairment.",
    warnings: "Lower cure rates observed when CrCl 30–50 mL/min at initiation—likely due to early renal recovery. Adjust renal dosing cautiously in unstable renal function. Cross-reactivity low; side chains not shared with other β-lactams.",
    ams: "Restricted for MDR Pseudomonas or ESBL infections where narrower therapy is not suitable.",
    weightBased: false
  },
  "Colistin": {
    restricted: true,
    spectrum: "Active vs MDR Gram-negative bacilli including Acinetobacter, Pseudomonas aeruginosa, and some CRE. Intrinsically inactive vs Serratia, Proteus, Providencia, Morganella, Burkholderia cepacia.",
    dosing: "Use colistin-base-activity (CBA) dosing only. Load: 4 × body weight (mg CBA) once. Maintenance for CrCl ≥90: 180 mg CBA q12h. Adjust in renal impairment; HD/CRRT require specialized schedules.",
    renal: "High nephrotoxicity risk. Full renal-based reduction needed: 80–170 mg q12h depending on CrCl. HD: supplemental 40–50 mg after dialysis and with next dose.",
    hepatic: "No dosage adjustment required across Child-Pugh A–C.",
    duration: "Use shortest feasible course; typically 7–14+ days in MDR infections.",
    monitoring: "Renal function, cumulative dose, neuromuscular symptoms, paresthesias, mental status.",
    warnings: "Significant nephrotoxicity and neurotoxicity (~25% nephrotoxicity risk). Avoid with other nephrotoxins (aminoglycosides, amphotericin B, vancomycin). Resistance emerges quickly; combination therapy does not reliably improve mortality.",
    ams: "Restricted exclusively for MDR Gram-negative organisms when safer/effective options are unavailable.",
    weightBased: true
  },
  "Doripenem": {
    restricted: true,
    spectrum: "Broad-spectrum carbapenem active vs Enterobacterales, ESBL producers, Pseudomonas aeruginosa, anaerobes, and Gram-positive cocci.",
    dosing: "500 mg IV q8h infused over 1 hr. Extended infusions (up to 4 hr) may optimize PK/PD but do NOT exceed approved dosing.",
    renal: "CrCl 30–50: 250 mg q8h; CrCl 10–30: 250 mg q12h; <10: insufficient data.",
    hepatic: "Insufficient data, but no routine adjustment suggested.",
    duration: "Generally 7–14 days depending on infection type.",
    monitoring: "Renal function; seizure risk; interaction with valproic acid (lowers serum VPA).",
    warnings: "Not approved for pneumonia. Associated with increased mortality and poorer cure rates in VAP vs comparators. Same class seizure risk as other carbapenems.",
    ams: "Restricted carbapenem—reserve for cases requiring broad GNB + anaerobic coverage when meropenem/imipenem are unsuitable.",
    weightBased: false
  },
  "Ertapenem": {
    restricted: true,
    spectrum: "Enterobacterales including ESBL-producers; anaerobes; good Gram-negative except NO activity vs Pseudomonas or Acinetobacter.",
    dosing: "1 g IV/IM q24h (adult standard).",
    renal: "CrCl ≤30 mL/min: 500 mg q24h. Hemodialysis: give dose after HD.",
    hepatic: "No adjustment required.",
    duration: "Typically 7–14 days depending on source.",
    monitoring: "Renal function; CNS effects in predisposed patients.",
    warnings: "Avoid for Pseudomonas or Acinetobacter infections; seizure risk in CNS disease or renal impairment.",
    ams: "Restricted for ESBL infections **without** Pseudomonas risk.",
    weightBased: false
  },
  "Fluconazole IV": {
    restricted: true,
    spectrum: "Candida spp. (not C. krusei; variable C. glabrata), Cryptococcus.",
    dosing: "100–400 mg IV q24h (higher for severe infections).",
    renal: "CrCl ≤50: reduce to 50–200 mg q24h. HD: give full dose after dialysis.",
    hepatic: "No adjustment but monitor LFTs.",
    duration: "Depends on syndrome; candidemia ≥14 days after clearance.",
    monitoring: "LFTs, QT interval.",
    warnings: "Alopecia at high doses, hepatotoxicity, QT prolongation, major drug interactions.",
    ams: "Restricted antifungal for parenteral administration.",
    weightBased: false
  },
  "Gentamicin": {
    restricted: true,
    spectrum: "Gram-negative aerobes (E. coli, Enterobacterales); poor Pseudomonas reliability; synergistic activity vs select Gram-positive cocci.",
    dosing: "Extended-interval: 5–7 mg/kg IV q24h (preferred). Synergy: 1 mg/kg IV q8h.",
    renal: "Substantial renal adjustment needed; extend interval when CrCl decreases. HD: redose post-dialysis.",
    hepatic: "No hepatic adjustment required.",
    duration: "Typically 5–7 days; avoid prolonged courses unless needed.",
    monitoring: "Drug levels (peak/trough or AUC), renal function, auditory/vestibular toxicity.",
    warnings: "Nephrotoxicity and ototoxicity; neuromuscular blockade risk; avoid with other nephrotoxins.",
    ams: "Restricted; use only for targeted Gram-negative infections or documented synergy indications.",
    weightBased: true
  },
  "Imipenem": {
    restricted: true,
    spectrum: "Broad-spectrum carbapenem. Activity similar to Imipenem-Cilastatin but requested as a separate restricted entity.",
    dosing: "Typical dose 500mg IV q6h or 1g IV q8h. Adjust for renal function.",
    renal: "CrCl < 70: adjustment required. CrCl < 15: avoid unless on dialysis.",
    hepatic: "No routine adjustment required.",
    duration: "7–14 days for most infections.",
    monitoring: "Renal function, seizure threshold.",
    warnings: "Risk of seizures; drug interaction with valproic acid.",
    ams: "Restricted carbapenem. Use strictly for MDR GNB or polymicrobial infections.",
    weightBased: false
  },
  "Imipenem-Cilastatin": {
    restricted: true,
    spectrum: "Very broad-spectrum: Enterobacterales (including ESBL), Pseudomonas, anaerobes, Gram-positive (not MRSA).",
    dosing: "500 mg IV q6h OR 1 g IV q8h. Use prolonged infusion when treating resistant organisms.",
    renal: "Adjust when CrCl <70 mL/min; avoid when CrCl <15 mL/min unless on dialysis.",
    hepatic: "No adjustment required.",
    duration: "Usually 7–14 days; longer for MDR or deep-seated infections.",
    monitoring: "Renal function; neurologic status (seizure risk).",
    warnings: "Highest seizure risk among carbapenems; avoid with valproic acid (interaction).",
    ams: "Restricted broad-spectrum carbapenem; use only when narrower agents inadequate.",
    weightBased: false
  },
  "Linezolid": {
    restricted: true,
    spectrum: "Strong activity vs MRSA, VRE (E. faecium > E. faecalis), and resistant Gram-positive cocci.",
    dosing: "600 mg IV or PO q12h (excellent oral bioavailability; PO = IV).",
    renal: "No adjustment required.",
    hepatic: "No adjustment required; monitor in severe hepatic dysfunction.",
    duration: "Try to limit to ≤14 days; prolonged use increases risk of cytopenias and neuropathy.",
    monitoring: "Weekly CBC; monitor for optic/peripheral neuropathy with prolonged therapy; drug–drug interactions.",
    warnings: "Risk of serotonin syndrome with SSRIs, MAOIs, TCAs, tramadol; lactic acidosis reported; thrombocytopenia common after 10–14 days.",
    ams: "Restricted; use only for MRSA or VRE infections where alternatives are unsuitable.",
    weightBased: false
  },
  "Meropenem": {
    restricted: true,
    spectrum: "Very broad: Enterobacterales including ESBL, Pseudomonas aeruginosa, anaerobes, and many Gram-positives.",
    dosing: "1 g IV q8h for most infections. For CNS infections or high-MIC organisms: 2 g IV q8h (extended infusion preferred).",
    renal: "Adjust when CrCl ≤50 mL/min; HD and CRRT require specific schedules.",
    hepatic: "No adjustment required.",
    duration: "Typically 7–14 days depending on infection.",
    monitoring: "Renal function; mental status for seizure risk.",
    warnings: "Seizure risk exists, particularly in renal impairment; interaction with valproic acid (↓ VPA levels).",
    ams: "Restricted carbapenem; reserve for ESBL, AmpC, and Pseudomonas infections when narrower agents unsuitable.",
    weightBased: false
  },
  "Micafungin": {
    restricted: true,
    spectrum: "Candida spp. (including C. glabrata, C. krusei) and some Aspergillus activity; inactive vs Cryptococcus and most molds.",
    dosing: "Candidemia: 100 mg IV q24h. Esophageal candidiasis: 150 mg IV q24h. Prophylaxis in HSCT: 50 mg IV q24h.",
    renal: "No dosage adjustment required—even in ESRD or dialysis.",
    hepatic: "No dosage adjustment required across Child-Pugh A–C.",
    duration: "Treat candidemia ≥14 days after first negative blood culture and symptom resolution.",
    monitoring: "LFTs; monitor for hepatotoxicity and infusion reactions.",
    warnings: "Rare but significant hepatitis; mild GI side effects; drug interactions with itraconazole, sirolimus, nifedipine.",
    ams: "Reserved for invasive candidiasis or when azoles/other antifungals are unsuitable.",
    weightBased: false
  },
  "Polymyxin B": {
    restricted: true,
    spectrum: "Active vs MDR Gram-negative bacilli including Pseudomonas aeruginosa, Acinetobacter baumannii, and some CRE. Intrinsically inactive vs Serratia, Proteus, Providencia, Morganella, and Burkholderia cepacia.",
    dosing: "Loading: 2.5 mg/kg IV once (actual body weight). Maintenance: 1.5 mg/kg IV q12h. No renal adjustment needed.",
    renal: "No dosage adjustment required, but nephrotoxicity still common—monitor closely.",
    hepatic: "No adjustment required across Child-Pugh A–C.",
    duration: "Usually 7–14+ days depending on infection severity and response.",
    monitoring: "Renal function, neurotoxicity (paresthesias, ataxia), cumulative dose.",
    warnings: "Nephrotoxicity and neurotoxicity significant; avoid with other nephrotoxins; combination therapy with carbapenem often recommended for efficacy.",
    ams: "Restricted to MDR Gram-negative infections when no safer alternatives exist.",
    weightBased: true
  },
  "Remdesivir": {
    restricted: true,
    spectrum: "SARS-CoV-2; broad antiviral activity vs coronaviruses.",
    dosing: "200 mg IV once, then 100 mg IV q24h. Infuse over 30–120 min.",
    renal: "Avoid if eGFR <30 mL/min due to SBECD accumulation risk.",
    hepatic: "Check ALT/AST before and during therapy; avoid if markedly elevated.",
    duration: "5 days typical; up to 10 days for severe/ventilated; 3-day outpatient course for early disease.",
    monitoring: "LFTs; watch for infusion reactions and Flat bradycardia.",
    warnings: "ALT/AST elevations; hypersensitivity; infusion reactions; SBECD accumulation in low eGFR.",
    ams: "Restricted for COVID-19 cases following institutional protocols.",
    weightBased: false
  },
  "Tigecycline": {
    restricted: true,
    spectrum: "Broad: MRSA, VRE, anaerobes, ESBL producers, atypicals — NO Pseudomonas.",
    dosing: "100 mg IV loading dose, then 50 mg IV q12h.",
    renal: "No dose adjustment.",
    hepatic: "Reduce maintenance dose in severe hepatic impairment (Child-Pugh C).",
    duration: "7–14 days depending on infection.",
    monitoring: "LFTs; GI intolerance (severe nausea common).",
    warnings: "Higher mortality signal in meta-analyses; avoid as monotherapy for severe bloodstream infections.",
    ams: "Restricted salvage option for MDR infections lacking alternatives.",
    weightBased: false
  },
  "Valganciclovir oral": {
    restricted: true,
    spectrum: "CMV; activity vs other herpesviruses but rarely used for them.",
    dosing: "900 mg PO q12h for induction; 900 mg PO daily for maintenance/prophylaxis.",
    renal: "Strong renal adjustment required using CrCl.",
    hepatic: "Monitor LFTs although no formal adjustment guidelines.",
    duration: "Weeks to months depending on indication.",
    monitoring: "CBC (neutropenia, anemia, thrombocytopenia), renal function.",
    warnings: "Bone marrow suppression; potential infertility; teratogenic; tablets should not be crushed.",
    ams: "Restricted for CMV treatment or prophylaxis.",
    weightBased: false
  },
  "Vancomycin": {
    restricted: true,
    spectrum: "MRSA, MRSE, resistant Gram-positive cocci; oral form for C. difficile only.",
    dosing: "15–20 mg/kg IV q8–12h (AUC-guided preferred); loading 25–30 mg/kg for severe illness.",
    renal: "Adjust by CrCl and AUC; dialysis-specific dosing protocols apply.",
    hepatic: "No major adjustment.",
    duration: "Variable depending on infection site.",
    monitoring: "AUC or troughs; renal function; auditory function with prolonged therapy.",
    warnings: "Infusion reactions; nephrotoxicity (higher risk with piperacillin-tazobactam); ototoxicity; rare DRESS.",
    ams: "Restricted for MRSA/resistant Gram-positive organisms only.",
    weightBased: true
  },
  "Voriconazole": {
    restricted: true,
    spectrum: "Aspergillus spp.; Candida spp. including krusei; Fusarium; Scedosporium; many molds — NOT Mucor.",
    dosing: "6 mg/kg IV q12h × 2 doses, then 4 mg/kg IV q12h OR 200 mg PO q12h.",
    renal: "Avoid IV if CrCl <50 mL/min (SBECD accumulation); PO is acceptable.",
    hepatic: "Reduce maintenance dose in Child-Pugh A/B; further reduction suggested in Child-Pugh C.",
    duration: "Weeks to months for invasive mold infections.",
    monitoring: "Drug levels (goal 1–5.5 μg/mL), LFTs, visual changes, photosensitivity.",
    warnings: "QT prolongation, hallucinations, hepatotoxicity, high drug-interaction burden, photosensitivity-related skin cancer risk.",
    ams: "Restricted mold-active azole for proven/probable invasive mold disease.",
    weightBased: true
  },

  // ======================================
  //            MONITORED ADULT
  // ======================================
  "Ceftriaxone": {
    restricted: false,
    spectrum: "Broad GN including Enterobacterales; some GP; no Pseudomonas.",
    dosing: "1–2 g IV q24h (up to 4 g/day for severe disease).",
    renal: "No adjustment unless combined renal + hepatic failure.",
    hepatic: "Risk of biliary sludging; caution in severe impairment.",
    duration: "Typically 5–10 days.",
    monitoring: "LFTs.",
    warnings: "Avoid in neonates due to calcium-precipitation risk.",
    ams: "Monitored due to high overuse.",
    weightBased: false
  },
  "Cefotaxime": {
    restricted: false,
    spectrum: "Third-generation cephalosporin with broad Gram-negative coverage; similar to ceftriaxone but with a shorter half-life, requiring more frequent dosing (q8h). Good CNS penetration.",
    dosing: "1–2 g IV q8h. Up to 12 g/day for meningitis.",
    renal: "CrCl < 20 mL/min: Administer 50% of the normal dose at the usual interval or the full dose at double the interval.",
    hepatic: "No dosage adjustment required.",
    duration: "Typically 7–14 days depending on the site of infection.",
    monitoring: "Renal function, CBC (long-term therapy).",
    warnings: "Hypersensitivity to beta-lactams; risk of C. difficile-associated diarrhea.",
    ams: "Monitored antimicrobial; de-escalate as soon as susceptibility results are available.",
    weightBased: false
  },
  "Ceftazidime": {
    restricted: false,
    spectrum: "Strong GN including Pseudomonas; weak GP; hydrolyzed by ESBL producers.",
    dosing: "1–2 g IV q8–12h (severe infections often 2 g q8h).",
    renal: "CrCl >50: none; 10–50: give q12–24h; <10: q24h; HD: 0.5–1 g q24h after dialysis.",
    hepatic: "No dose adjustment (Child-Pugh A–C).",
    duration: "7–14 days.",
    monitoring: "Renal function; CNS effects; hypersensitivity.",
    warnings: "Shares R1 side chain with aztreonam → possible cross-reactivity. Risk of C. difficile.",
    ams: "Monitored Pseudomonas agent; avoid as monotherapy in high ESBL-risk settings.",
    weightBased: false
  },
  "Ciprofloxacin": {
    restricted: false,
    spectrum: "Strong GN including Pseudomonas; atypicals; limited GP.",
    dosing: "IV 200–400 mg q8–12h; PO 500–750 mg q12h (or 400 mg IV q8h equivalent).",
    renal: "Tablet (non-XR): CrCl 30–50 → q12h; CrCl 5–29 → q18h. Injection: CrCl 5–29 → q18–24h.",
    hepatic: "No adjustment.",
    duration: "7–14 days.",
    monitoring: "QT interval, renal function, tendinopathy.",
    warnings: "Tendon rupture, QT prolongation, worsening myasthenia gravis.",
    ams: "Monitored due to resistance pressure and collateral damage.",
    weightBased: false
  },
  "Fluconazole oral": {
    restricted: false,
    spectrum: "Candida spp. (not C. krusei; variable C. glabrata), Cryptococcus.",
    dosing: "100–400 mg PO q24h (higher for severe infections).",
    renal: "CrCl ≤50: reduce to 50–200 mg q24h. HD: give full dose after dialysis.",
    hepatic: "No adjustment but monitor LFTs.",
    duration: "Depends on syndrome; candidemia ≥14 days after clearance.",
    monitoring: "LFTs, QT interval.",
    warnings: "Alopecia at high doses, hepatotoxicity, QT prolongation, major drug interactions.",
    ams: "Monitored antifungal for oral administration.",
    weightBased: false
  },
  "Levofloxacin": {
    restricted: false,
    spectrum: "Respiratory FQ: GN, GP, atypicals; Pseudomonas activity.",
    dosing: "500–750 mg IV/PO q24h.",
    renal: "CrCl 20–49: 750 mg q48h; CrCl <20: 750 mg x1 then 500 mg q48h; HD similar.",
    hepatic: "No adjustment.",
    duration: "5–14 days.",
    monitoring: "QT interval, renal, tendons.",
    warnings: "High QT risk; avoid with other QT agents.",
    ams: "Monitored due to broad spectrum.",
    weightBased: false
  },
  "Moxifloxacin": {
    restricted: false,
    spectrum: "Enhanced GP and anaerobes; no Pseudomonas.",
    dosing: "400 mg IV/PO q24h.",
    renal: "No adjustment.",
    hepatic: "Avoid in severe hepatic dysfunction.",
    duration: "5–10 days typically.",
    monitoring: "QT interval.",
    warnings: "Significant QT prolongation risk; avoid with QT drugs.",
    ams: "Monitored; avoid if Pseudomonas suspected.",
    weightBased: false
  },
  "Piperacillin–Tazobactam": {
    restricted: false,
    spectrum: "Broad GN including Pseudomonas; GP; anaerobes.",
    dosing: "Extended infusion preferred: 4.5 g IV over 4 hr q8h. Intermittent: 3.375–4.5 g q6h.",
    renal: "Extended-infusion: CrCl <20 → q12h. Intermittent: adjust by CrCl and indication (e.g., NP vs others).",
    hepatic: "No adjustment.",
    duration: "5–14 days.",
    monitoring: "Renal function, electrolytes (especially K+), CBC.",
    warnings: "High sodium load; increased creatinine due to tubular secretion competition; AKI signal when combined with vancomycin.",
    ams: "Monitored broad-spectrum; avoid for ESBL infections.",
    weightBased: false
  }
};