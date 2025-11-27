import { SignUpType, User } from './types';
import { auth, db } from './firebaseConfig'; 
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

/**
 * 1. Creates the user profile document in Firestore using the Auth UID as the document ID.
 * This ensures a 1:1 mapping between the authenticated user and their profile data.
 */
const createFirestoreProfile = async (
  uid: string,
  data: Omit<SignUpType, "password" | "confirmPassword">
) => {
  const fNameLower = data.fName.toLowerCase();
  const lNameLower = data.lName.toLowerCase();
  const emailLower = data.email.toLowerCase();

  const searchIndex = [
    fNameLower,
    lNameLower,
    `${fNameLower} ${lNameLower}`,
    emailLower,
    ...fNameLower.split(""),  // optional: allows typing single letters
    ...lNameLower.split("")
  ];

  const userData = {
    uid: uid,
    email: data.email,
    fName: data.fName,
    lName: data.lName,
    birthday: data.birthday,
    picture: "",
    search: searchIndex,
  };

  await setDoc(doc(db, "users", uid), userData);
};






const createUserChatDocument = async (uid: string) => {
  await setDoc(doc(db, "userChats", uid), {}); 
};





/**
 * 2. Main signup handler: Authenticates the user and saves their profile to Firestore.
 */
export const handleSignUp = async (formData: SignUpType) => {
  const { email, password, confirmPassword, fName, lName, birthday } = formData;

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // Create Firestore profile
    await createFirestoreProfile(uid, { email, fName, lName, birthday });

    // 🔥 Create userChats document for messaging
    await createUserChatDocument(uid);

    console.log("Signup successful! Chat ID created. UID:", uid);
    return userCredential.user;

  } catch (error) {
    console.error("Signup failed:", error);
    throw error;
  }
};
