
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
  "Dr. Christopher John Tibayan",
  "Dr. Jelly Ann Gozun-Recuenco",
  "Dr. Paulo Garcia"
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
  "Imipenem", "Meropenem", "Ertapenem", "Doripenem", "Gentamicin", 
  "Amikacin", "Ciprofloxacin", "Levofloxacin", "Moxifloxacin", 
  "Aztreonam", "Ceftolozane-Tazobactam", "Colistin", "Linezolid", 
  "Tigecycline", "Vancomycin", "Cefepime", "Fluconazole oral"
].sort();

export const RESTRICTED_DRUGS = [
  "Ciprofloxacin", "Levofloxacin", "Moxifloxacin", "Ceftriaxone", 
  "Cefotaxime", "Ceftazidime", "Cefixime", "Cefpodoxime", 
  "Gentamicin", "Amikacin", "Clindamycin", "Fluconazole IV"
].sort();

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
