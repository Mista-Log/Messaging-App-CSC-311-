import EmojiPicker from "emoji-picker-react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  DocumentData,
  getDocs,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import emptyProfile from "../assets/empty-profile.png";
import { db } from "../core/firebaseConfig";



type TypeSearchResult = {
  fName: string;
  lName: string;
  picture: string;
  uid: string;
  email: string;
};

type Props = {
  userId: string;
  closePopup: () => void;
};

export default function AddUser({ userId, closePopup }: Props) {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<TypeSearchResult[]>();
  const [loading, setLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);



  
  const searchHandler = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission if in a form

    if (!db || !search.trim()) return;

    setLoading(true);
    setSearchResult(undefined);
    setAddError(null);

    try {
      // Query users where the 'search' array contains the search term (case-insensitive)
      const q = query(
        collection(db, "users"),
        where("search", "array-contains", search.toLowerCase())
      );

      console.log(q)

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

      const results: TypeSearchResult[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        // Exclude the current user from the search results
        if (doc.data().uid !== userId) {
            results.push({
                email: doc.data().email,
                fName: doc.data().fName,
                lName: doc.data().lName,
                picture: doc.data().picture,
                uid: doc.data().uid,
            });
        }
      });
      setSearchResult(results);
      console.log(results)

    } catch (e) {
      console.error("Error during user search:", e);
      setAddError("Could not search for users. Please try again.");
    } finally {
      setLoading(false);
    }
  };


const addHandler = async (otherUid: string) => {
  if (!db) return;

  try {
    console.log("🟦 START addHandler for:", otherUid);

    // ⭐ STEP 1: Generate deterministic chat ID
    const chatId =
      userId > otherUid
        ? userId + otherUid
        : otherUid + userId;

    console.log("Generated chatId:", chatId);

    // STEP 2: Check if chat exists
    const chatDocRef = doc(db, "chats", chatId);
    const chatDocSnap = await getDoc(chatDocRef);

    if (chatDocSnap.exists()) {
      console.log("Chat already exists:", chatId);
      closePopup();
      return chatId;
    }

    console.log("No existing chat, creating new one…");

    // STEP 3: Fetch user profiles
    const currentUserData = (
      await getDoc(doc(db, "users", userId))
    ).data();

    const otherUserData = (
      await getDoc(doc(db, "users", otherUid))
    ).data();

    // STEP 4: Create chat
    await setDoc(chatDocRef, {
      id: chatId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
      userIds: [userId, otherUid],

      users: {
        [userId]: currentUserData,
        [otherUid]: otherUserData,
      },
    });

    console.log("Chat created:", chatId);

    // STEP 5: Update userChats for both users
    await updateDoc(doc(db, "userChats", userId), {
      [chatId]: {
        userInfo: otherUserData,
        lastMessage: "",
        date: serverTimestamp(),
      },
    });

    await updateDoc(doc(db, "userChats", otherUid), {
      [chatId]: {
        userInfo: currentUserData,
        lastMessage: "",
        date: serverTimestamp(),
      },
    });

    console.log("UserChats updated for both users.");
    closePopup();

    return chatId;

  } catch (e) {
    console.error("❌ ADD HANDLER ERROR:", e);
    setAddError("Failed to start a chat.");
  }
};








  return (
    <div className="flex h-96 flex-col space-y-4 font-jakarta items-center p-4 bg-white rounded-xl shadow-2xl">
      <div className="self-start w-full border-b pb-2">
        <p className="text-green-600 font-bold text-center text-lg">
          Start a New Conversation
        </p>
      </div>

      <form className="w-full flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 items-center">
        <div className="flex space-x-2 border-2 border-gray-300 w-full items-center bg-white px-3 py-2 rounded-lg focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition duration-150">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full placeholder-gray-500"
            placeholder="Search by name or email"
            type="search"
            value={search}
            disabled={loading}
          />
        </div>
        <button
          disabled={loading || !search.trim()}
          onClick={searchHandler}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer active:scale-[0.98] transition w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error Message */}
      {addError && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-300 w-full p-2 rounded-lg text-center">{addError}</p>
      )}

      {/* Search Results Display */}
      <div className="flex overflow-y-auto w-full flex-col gap-2 py-4 border-t mt-2">
        {searchResult?.length === 0 && !loading && (
          <p className="text-gray-500 text-center">No users found matching "{search}".</p>
        )}
        
        {searchResult?.map((user) => (
          <div
            key={user.uid}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-150 border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <img
                src={user.picture || emptyProfile}
                alt="user profile"
                className="h-10 w-10 rounded-full object-cover border border-gray-300"
                onError={(e) => {
                    // Fallback in case image loading fails
                    e.currentTarget.src = emptyProfile;
                }}
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {user.fName} {user.lName}
                </p>
                <p className="text-xs font-medium text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <button
              onClick={() => addHandler(user.uid)}
              className="flex items-center space-x-1 text-green-600 bg-green-100 hover:bg-green-200 p-2 rounded-full transition active:scale-90"
              title={`Start chat with ${user.fName}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
        {searchResult === undefined && !loading && (
            <p className="text-gray-400 text-center pt-8">Type a name or email and click Search to find users.</p>
        )}
      </div>
    </div>
  );
}
