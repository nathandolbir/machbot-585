import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

// credential information for accessing firebase app, not a security concern
firebase.initializeApp({
  apiKey: "AIzaSyCIbU7r8ovKudc3W-COb-OUMjn2huMv-r4",
  authDomain: "oval-tuner-326314.firebaseapp.com",
  projectId: "oval-tuner-326314",
  storageBucket: "oval-tuner-326314.appspot.com",
  messagingSenderId: "614927895475",
  appId: "1:614927895475:web:9e6ef1e7f6eb8c802f59c6",
  measurementId: "G-BK8T5T10B8",
});

const auth = firebase.auth(); // used for user authorization into app
const firestore = firebase.firestore(); // used to access firestore doc-DB
const analytics = firebase.analytics();
function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>⚛MediBot💬</h1>
        <SignOut />
      </header>
      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <div style={{ alignItems: "center" }}>
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
}

function ChatRoom(props) {
  const dummy = useRef();
  let userid = auth.currentUser.uid;
  let username = auth.currentUser.displayName; // Nathan Dolbir
  const messagesRef = firestore.collection(userid);
  const dialogRef = firestore.collection("dialog");
  const [name, setName] = useState("");
  const [viewAddName, setViewAddName] = useState("#333333");
  const [distilButtonColor, setDistilButtonColor] = useState("#333333");
  const [BERTButtonColor, setBERTButtonColor] = useState("#333333");
  const [mobileButtonColor, setMobileButtonColor] = useState("#333333");
  const [electraButtonColor, setElectraButtonColor] = useState("#333333");
  const [roBERTaButtonColor, setRoBERTaButtonColor] = useState("#333333");
  const modelsRef = dialogRef.doc("Models");

  let nameRef = messagesRef.doc("Name");
  function buttonChange() {
    modelsRef.get().then((doc) => {
      let color = doc.data().DistilBERT;
      if (color === true) setDistilButtonColor("#111111");
      else setDistilButtonColor("#333333");
      let colora = doc.data().BERT;
      if (colora === true) setBERTButtonColor("#111111");
      else setBERTButtonColor("#333333");
      let colorb = doc.data().MobileBERT;
      if (colorb === true) setMobileButtonColor("#111111");
      else setMobileButtonColor("#333333");
      let colorc = doc.data().Electra;
      if (colorc === true) setElectraButtonColor("#111111");
      else setElectraButtonColor("#333333");
      let colord = doc.data().RoBERTa;
      if (colord === true) setRoBERTaButtonColor("#111111");
      else setRoBERTaButtonColor("#333333");
    });
  }
  function nameSet() {
    let bool = false;
    nameRef.get().then((docSnapshot) => {
      if (docSnapshot.exists) {
        nameRef.onSnapshot((doc) => {
          let nameFound = doc.get("name");
          setName(nameFound);
          setViewAddName(false);
        });
      }
    });
    return bool;
  }
  nameSet();
  //console.log(set);
  const query = messagesRef.orderBy("createdAt");
  buttonChange();
  const [messages, load] = useCollectionData(query);
  let msgLength = 0;
  if (load === false) {
    msgLength = messages.length;
  }
  //const length = messages.length;
  // console.log(length);

  const [formValue, setFormValue] = useState("");
  // console.log(getNumMessages(messages));

  const sendMessage = async (e) => {
    e.preventDefault();
    const botResponse = "I am thinking...";
    const { uid, photoURL } = auth.currentUser;
    const docName = `message${msgLength}`;
    await (messagesRef.doc(docName).set({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      botResponse: botResponse,
      metadata: false,
      uid,
      photoURL,
    }) &&
      dialogRef.doc("InputOutput").set({
        input: formValue,
        collection: userid,
        doc: docName,
      }));

    setFormValue("");
    dummy.current.scrollIntoView({ behavior: "smooth" });
  };
  function setModel(model) {
    const modelsRef = dialogRef.doc("Models");
    modelsRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          if (model === "DistilBERT") {
            modelsRef.update({ DistilBERT: !doc.data().DistilBERT });
          } else if (model === "BERT") {
            modelsRef.update({ BERT: !doc.data().BERT });
          } else if (model === "RoBERTa") {
            modelsRef.update({ RoBERTa: !doc.data().RoBERTa });
          } else if (model === "MobileBERT") {
            modelsRef.update({ MobileBERT: !doc.data().MobileBERT });
          } else if (model === "Electra") {
            modelsRef.update({ Electra: !doc.data().Electra });
          }
        } else {
          console.log("No such document");
        }
      })
      .catch((error) => {
        console.log("Error getting the models document");
      });
  }

  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => (
            <React.Fragment>
              <ChatMessage message={msg} />
              <BotMessage message={msg} />
            </React.Fragment>
          ))}
        {viewAddName ? (
          <AddUser
            username={username}
            messagesRef={messagesRef}
            dummy={dummy}
          ></AddUser>
        ) : (
          <div class="user">Welcome back, {name}!</div>
        )}
        <ul class="model">
          <li>
            <h2
              onClick={() => {
                setModel("DistilBERT");
                buttonChange();
                console.log("in distillbert button change");
                setInterval(buttonChange(), 1000);
              }}
              style={{ backgroundColor: distilButtonColor }}
            >
              DistilBERT
            </h2>
          </li>
          <li>
            <h2
              onClick={() => {
                setModel("RoBERTa");
                buttonChange();
              }}
              style={{ backgroundColor: roBERTaButtonColor }}
            >
              RoBERTa
            </h2>
          </li>
          <li>
            <h2
              onClick={() => {
                setModel("BERT");
                setTimeout(buttonChange(), 300);
              }}
              style={{ backgroundColor: BERTButtonColor }}
            >
              BERT
            </h2>
          </li>
          <li>
            <h2
              onClick={() => {
                setModel("Electra");
                setTimeout(buttonChange(), 300);
              }}
              style={{ backgroundColor: electraButtonColor }}
            >
              Electra
            </h2>
          </li>
          <li>
            <h2
              onClick={() => {
                setModel("MobileBERT");
                setTimeout(buttonChange(), 300);
              }}
              style={{ backgroundColor: mobileButtonColor }}
            >
              MobileBERT
            </h2>
          </li>
        </ul>
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="say something to MediBot"
        />
        <button type="submit" disabled={!formValue}>
          🕊️
        </button>
      </form>
    </>
  );
}

function AddUser(props) {
  const [formValue, setFormValue] = useState("");
  const username = props.username;
  const messagesRef = props.messagesRef;
  const dummy = props.dummy;
  const setName = async (e) => {
    e.preventDefault();
    await messagesRef.doc("Name").set({
      name: formValue,
      // createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      // commented out so that I can correctly display messages ordered by createdAt
      metadata: true,
    });
    setFormValue("");
    dummy.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <form className="adduser" onSubmit={setName}>
      <p>Hello {username}! What would you like Machbot to call you?</p>
      <input
        value={formValue}
        onChange={(e) => setFormValue(e.target.value)}
        placeholder="Enter a name"
      />

      <button type="submit" disabled={!formValue}>
        Set
      </button>
    </form>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img
          src={
            photoURL || "https://api.adorable.io/avatars/23/abott@adorable.png"
          }
        />
        <p>{text}</p>
      </div>
    </>
  );
}

function BotMessage(props) {
  const { botResponse } = props.message;
  if (botResponse === "I am thinking...") {
    return (
      <>
        <div className={`message received`}>
          <img
            src={
              "	https://blogs.3ds.com/northamerica/wp-content/uploads/sites/4/2019/08/Robots-Square-610x610.jpg"
            }
          />
          <div class="dot-pulse"></div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className={`message received`}>
          <img
            src={
              "	https://blogs.3ds.com/northamerica/wp-content/uploads/sites/4/2019/08/Robots-Square-610x610.jpg"
            }
          />
          <p>{botResponse}</p>
        </div>
      </>
    );
  }
}

export default App;
