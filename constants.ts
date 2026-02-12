import { UserRole } from './types';

export const PHARMACISTS = [
  "Abello, Corazon L.",
  "Barroquillo, John Patrick L.",
  "Calma, Annalyn B.",
  "Carpio, Leiz Anne M.",
  "Cruz, Noemee Hyacinth D.",
  "Dela Cruz, Shella M.",
  "Delas Alas, Allysa Marie J.",
  "Domingo, Deanne P.",
  "Enriquez, Joan M.",
  "Fallasgon, Charmen Joy G.",
  "Fernandez, Rudy R.",
  "Heraldo, Charmaine Mechelle",
  "Hermoso, Zenaida R.",
  "Maglalang, Jose Philip G.",
  "Mulbog, Rhozen Z.",
  "Navales, Hyra Mae R.",
  "Oasay, Victoria C.",
  "Obregon, Jose Nicolas F.",
  "Parane, Ruth D.",
  "Pasion, Kathleen Leah M.",
  "Quintana, Marshiel L.",
  "Romero, Sienna Marie D.",
  "Tan, Ma. Guillene B.",
  "Tse, Clarice Kimba D.",
  "Valencia, Adhelyn Jay E.",
  "Villanueva, Roxan D.",
  "Ybalane, Jeremy V."
].sort();

export const IDS_SPECIALISTS_ADULT = [
  "Dr. Christoper John Tibayan",
  "Dr. Jelly Ann Gozun-Recuenco",
  "Dr. Rico Paolo Garcia"
].sort();

export const IDS_SPECIALISTS_PEDIATRIC = [
  "Dr. Michelle Carandang-Cuvin",
  "Dr. Pia Catrina Tolentino Torres"
].sort();

export const IDS_SPECIALISTS = [
  ...IDS_SPECIALISTS_ADULT,
  ...IDS_SPECIALISTS_PEDIATRIC
].sort();

export const WARDS = [
  "6th Floor Ward",
  "7th Floor Ward",
  "ARI 2",
  "Dengue Ward",
  "Emergency Room Complex",
  "ICU",
  "Infectious Ward",
  "Medicine Female",
  "Medicine Isolation Room",
  "Medicine Male",
  "NICU",
  "NICU Transition",
  "NON-SARI",
  "OB Gyne Ward",
  "Pedia 3 Pulmo (Hema Ward)",
  "Pedia Cohort",
  "Pedia ICU",
  "Pedia ISO (4th)",
  "Pedia Isolation",
  "Pedia Ward 1 Stepdown",
  "Pedia Ward 3",
  "Pedia Ward 3 Extension",
  "Respiratory ICU",
  "SARI",
  "SARI 1",
  "SARI 2",
  "SARI 3",
  "Surgery Ward"
].sort();

export const MONITORED_DRUGS = [
  "Meropenem", "Ertapenem", "Doripenem", "Gentamicin", 
  "Amikacin", "Ciprofloxacin", "Levofloxacin", "Moxifloxacin", 
  "Aztreonam", "Ceftolozane-Tazobactam", "Colistin", "Linezolid", 
  "Tigecycline", "Vancomycin", "Cefepime", "Fluconazole oral", "Cefotaxime"
].sort();

export const RESTRICTED_DRUGS = [
  "Imipenem", "Imipenem-Cilastatin", "Ciprofloxacin", "Levofloxacin", "Moxifloxacin", "Ceftriaxone", 
  "Ceftazidime", "Cefixime", "Cefpodoxime", 
  "Gentamicin", "Amikacin", "Clindamycin", "Fluconazole IV"
].sort();

export const DETAILED_SYSTEM_SITE_OPTIONS = [
  { code: "CNS", description: "Infections of the Central Nervous System" },
  { code: "Proph CNS", description: "Prophylaxis for CNS (neurosurgery, meningococcal)" },
  { code: "EYE", description: "Therapy for Eye infections (e.g., endophthalmitis)" },
  { code: "Proph EYE", description: "Prophylaxis for Eye operations" },
  { code: "ENT", description: "Therapy for Ear, Nose, Throat infections including mouth, sinuses, larynx" },
  { code: "AOM", description: "Acute otitis media" },
  { code: "LUNG", description: "Lung abscess including aspergilloma" },
  { code: "Proph RESP", description: "Pulmonary surgery, prophylaxis for respiratory pathogens (e.g., aspergillosis)" },
  { code: "URTI", description: "Upper respiratory tract viral infections (including influenza but not ENT)" },
  { code: "Bron", description: "Acute bronchitis or exacerbations of chronic bronchitis" },
  { code: "Pneu", description: "Pneumonia or LRTI (lower respiratory tract infections)" },
  { code: "COVID-19", description: "Coronavirus disease caused by SARS-CoV-2 infection" },
  { code: "TB", description: "Pulmonary tuberculosis" },
  { code: "CF", description: "Cystic fibrosis" },
  { code: "CVS", description: "Cardiovascular system infections: endocarditis, endovascular device infection (e.g., pacemaker, vascular graft)" },
  { code: "Proph CVS", description: "Cardiac or vascular surgery prophylaxis; endocarditis prophylaxis" },
  { code: "GI", description: "Gastrointestinal infections (salmononellosis, Campylobacter, parasitic infections)" },
  { code: "Proph GI", description: "Gastrointestinal tract surgery, liver/biliary tree procedures; GI prophylaxis in neutropenic patients or hepatic failure" },
  { code: "IA", description: "Intra-abdominal sepsis including hepatobiliary and intra-abdominal abscess" },
  { code: "CDIF", description: "Clostridioides difficile infection" },
  { code: "SST", description: "Skin and soft tissue infections: cellulitis, surgical site infection, deep soft tissue infection not involving bone (e.g., infected pressure ulcer, diabetic ulcer, abscess)" },
  { code: "BJ", description: "Bone/Joint infections: septic arthritis (including prosthetic joint), osteomyelitis" },
  { code: "Cys", description: "Lower urinary tract infection (UTI): cystitis" },
  { code: "Proph UTI", description: "Prophylaxis for urological surgery (SP) or recurrent urinary tract infection (MP)" },
  { code: "Pye", description: "Upper UTI including catheter-related UTI, pyelonephritis" },
  { code: "ASB", description: "Asymptomatic bacteriuria" },
  { code: "OBGY", description: "Obstetric/gynecological infections, sexually transmitted diseases (STD) in women" },
  { code: "Proph OBGY", description: "Prophylaxis for obstetric or gynecological surgery (SP: caesarean section, no episiotomy; MP: carriage of group B streptococcus)" },
  { code: "GUM", description: "Genito-urinary males + prostatitis, epididymo-orchitis, STD in men" },
  { code: "BAC", description: "Bacteraemia or fungaemia with no clear anatomic site and no shock" },
  { code: "SEPSIS", description: "Sepsis of any origin (e.g., urosepsis, pulmonary sepsis), sepsis syndrome or septic shock with no clear anatomic site; includes fungaemia (candidemia) with septic symptoms" },
  { code: "Malaria", description: "Malaria" },
  { code: "HIV", description: "Human immunodeficiency virus" },
  { code: "PUO", description: "Pyrexia of Unknown Origin; fever syndrome without identified source or site" },
  { code: "PUO-HO", description: "Fever syndrome in non-neutropenic hemato-oncology patients with no identified source" },
  { code: "FN", description: "Fever in the neutropenic patient" },
  { code: "LYMPH", description: "Lymphatics as the primary source of infection (e.g., suppurative lymphadenitis)" },
  { code: "Sys-DI", description: "Disseminated infection (viral infections such as measles, CMV, etc.)" },
  { code: "Other", description: "Antimicrobial prescribed with documentation but no defined diagnosis group" },
  { code: "MP-GEN", description: "Medical prophylaxis in general without targeting a specific site (e.g., antifungal prophylaxis during immunosuppression)" },
  { code: "UNK", description: "Completely unknown indication" },
  { code: "CLD", description: "Chronic lung disease: long-term respiratory problems in premature babies (bronchopulmonary dysplasia)" },
  { code: "OTHERS (SPECIFY)", description: "Clinical site or infection type not listed above" }
];

export const DEFAULT_PASSWORD = "osmak123";

export const LOGO_URL = "https://maxterrenal-hash.github.io/amsone/osmaklogo.png";

// Updated Firebase Configuration for 'osmakams'
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDSJw5370_qdiiWP_qDoYeWb8RhI9ULAv0",
  authDomain: "osmakams.firebaseapp.com",
  projectId: "osmakams",
  storageBucket: "osmakams.firebasestorage.app",
  messagingSenderId: "153269457656",
  appId: "1:153269457656:web:c63a5c01e0729f2dd1e10d",
  measurementId: "G-RFMGRNJQG2"
};

export const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzc3oDXYvKL89d38VZQDnakrxJu5H_P4LVtKLc3QEZSUgks8Xzc2nS9dbUPECu4374WHg/exec";