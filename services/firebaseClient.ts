
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants';

const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
