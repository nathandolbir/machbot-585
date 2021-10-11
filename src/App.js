import './App.css';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIbU7r8ovKudc3W-COb-OUMjn2huMv-r4",
  authDomain: "oval-tuner-326314.firebaseapp.com",
  projectId: "oval-tuner-326314",
  storageBucket: "oval-tuner-326314.appspot.com",
  messagingSenderId: "614927895475",
  appId: "1:614927895475:web:9e6ef1e7f6eb8c802f59c6",
  measurementId: "G-BK8T5T10B8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
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
  const msgref = messagesRef.orderBy("createdAt");
  const query = messagesRef.where("metadata", "==", false);
  const [messages] = useCollectionData(query);
  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    const botResponse = generateBotResponse(formValue);
    const { uid, photoURL } = auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      botResponse: botResponse,
      metadata: false,
      uid,
      photoURL
    })

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
          </React.Fragment>)}
      {viewAddName ? <AddUser username = { username } messagesRef = {messagesRef} dummy = { dummy }></AddUser> : <p style={{position:"center", margin:"auto"}}>Welcome back, {name}!</p>}
      <span ref={dummy}></span>
    </main>
    

    <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something nice" />

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
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      metadata: true
    })
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <form className="adduser" onSubmit={setName}>

  <p>Hello {username}! What would you like Medibot to call you?</p>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Enter a name" />

      <button type="submit" disabled={!formValue}>Set</button>
    </form>
  )
}

function generateBotResponse(text) {
  return "This is the bot's response to \"" + text + "\"";
}
/*
function AddName(props) {
      return (
            <p style={{margin:"20px"}}>You need to create a username</p>
            <button>Submit</button>
      )
}*/
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
  return (<>
    <div className={`message received`}>
      <img src={'	https://blogs.3ds.com/northamerica/wp-content/uploads/sites/4/2019/08/Robots-Square-610x610.jpg'} />
      <p>{botResponse}</p>
    </div>
  </>)
}

export default App;
