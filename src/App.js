import React, { useRef, useState } from 'react';
import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/analytics';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

// credential information for accessing firebase app, not a security concern
firebase.initializeApp({
apiKey: "AIzaSyCIbU7r8ovKudc3W-COb-OUMjn2huMv-r4",
authDomain: "oval-tuner-326314.firebaseapp.com",
projectId: "oval-tuner-326314",
storageBucket: "oval-tuner-326314.appspot.com",
messagingSenderId: "614927895475",
appId: "1:614927895475:web:9e6ef1e7f6eb8c802f59c6",
measurementId: "G-BK8T5T10B8"});

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
      <section>
        {user ? (<ChatRoom />) : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <div style={{alignItems:"center"}}>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}



function ChatRoom(props) {
  const dummy = useRef();
  let userid = auth.currentUser.uid;
  let username = auth.currentUser.displayName; // Nathan Dolbir
  const messagesRef = firestore.collection(userid);
  const dialogRef = firestore.collection("dialog")
  const [name, setName] = useState('');
  const [viewAddName, setViewAddName] = useState(true);
  let nameRef = messagesRef.doc("Name");
  
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
   })
   return bool;
  }
  nameSet();
  //console.log(set);
  const query = messagesRef.orderBy('createdAt');

  const [messages, load] = useCollectionData(query);
  let msgLength = 0;
  if (load===false) {
    msgLength = messages.length;
  }
  //const length = messages.length;
  // console.log(length);

  const [formValue, setFormValue] = useState('');
  // console.log(getNumMessages(messages));

  const sendMessage = async (e) => {
    e.preventDefault();
    const botResponse = "I am thinking..."
    const { uid, photoURL } = auth.currentUser;
    const docName = `message${msgLength}`;
    await (messagesRef.doc(docName).set({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      botResponse: botResponse,
      metadata: false,
      uid,
      photoURL
    }) && dialogRef.doc("InputOutput").set({
      input: formValue, 
      collection: userid, 
      doc: docName}));

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }


  return (<>
    <main>
      {
        messages && messages.map(msg =>
          <React.Fragment>
            <ChatMessage message={msg}/>
            <BotMessage message={msg}/>
          </React.Fragment>)
          }
      {viewAddName ? <AddUser username = { username } messagesRef = {messagesRef} dummy = { dummy }></AddUser> :
        <div class = "user">Welcome back, {name}!</div>
      }
      <ul class = "model">
        <li>Model1</li>
        <li>Model2</li>
        <li>Model3</li>
      </ul>
      <span ref={dummy}></span>
    </main>
    
    
    <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something to MediBot"/>
      <div onClick="showList()">choose models</div>
      <button type="submit" disabled={!formValue}>🕊️</button>

    </form>
  </>)
}

function AddUser(props) {
  const [formValue, setFormValue] = useState('');
  const username = props.username;
  const messagesRef = props.messagesRef;
  const dummy = props.dummy;
  const setName = async (e) => {
    e.preventDefault();
    await messagesRef.doc("Name").set({
      name: formValue,
      // createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      // commented out so that I can correctly display messages ordered by createdAt
      metadata: true
    })
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <form className="adduser" onSubmit={setName}>

    <p>Hello {username}! What would you like Machbot to call you?</p>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Enter a name" />

      <button type="submit" disabled={!formValue}>Set</button>
    </form>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (<>
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <p>{text}</p>
    </div>
  </>)
}

function BotMessage(props) {
  const { botResponse } = props.message;
  if (botResponse === "I am thinking...") {
    return (<>
      <div className={`message received`}>
        <img src={'	https://blogs.3ds.com/northamerica/wp-content/uploads/sites/4/2019/08/Robots-Square-610x610.jpg'} />
        <div class="dot-pulse"></div>
      </div>
    </>)
  }
  else {
  return (<>
      <div className={`message received`}>
        <img src={'	https://blogs.3ds.com/northamerica/wp-content/uploads/sites/4/2019/08/Robots-Square-610x610.jpg'} />
        <p>{botResponse}</p>
      </div>
    </>)
  }
}

export default App;
