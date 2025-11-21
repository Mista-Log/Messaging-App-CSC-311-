import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../core/firebaseConfig";
import LeftSide from "../components/LeftSide";
import { doc, getDoc } from "firebase/firestore";
import { User } from "../core/types";
import RightSide from "../components/RightSide";

export default function Home() {
  const [selectedChatRoom, setSelectedChatRoom] = useState<string>("");
  const [windowWidth, setWindowWidth] = useState(0);
  const [user, setUser] = useState<User>();
  const [openChat, setOpenChat] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const res = await getDoc(doc(db, "users", currentUser.uid));
        setUser({
          uid: currentUser.uid,
          email: currentUser.email!,
          birthday: res.data()?.birthday,
          fName: res.data()?.fName,
          lName: res.data()?.lName,
          picture: res.data()?.picture,
        });
      } else {
        navigate("/login", { replace: true });
      }
    });
    return unsub;
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="grid overflow-auto grid-cols-7 font-jakarta h-screen">
      {(openChat || windowWidth > 768) && (
        <LeftSide
          setOpen={setOpenChat}
          selectedChatRoom={selectedChatRoom}
          setSelectedChatRoom={setSelectedChatRoom}
          picture={user.picture}
          userId={user.uid}
          displayName={`${user.fName || "____"} ${user.lName || "____"}`}
        />
      )}
      {(!openChat || windowWidth > 768) && (
        <RightSide
          setOpen={setOpenChat}
          userId={user.uid}
          chatRoomId={selectedChatRoom}
          picture={user.picture}
          fName={user.fName || "____"}
          lName={user.lName || "____"}
        />
      )}
    </div>
  );
}
