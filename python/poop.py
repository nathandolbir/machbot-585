'''import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Use a service account
cred = credentials.Certificate('serviceAccount.json')
firebase_admin.initialize_app(cred)

db = firestore.client()
dialogRef = db.collection(u'gHWzzi3uWzSKigLUcK3IUAmHjem2')
IOref = dialogRef.document(u'Name')
IOref.set({'name' : 'poop'})'''
import tensorflow as tf
import tensorflow_text
import numpy
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import random

def hello_firestore(data, context):
    """Triggered by a change to a Firestore document.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    cred = credentials.Certificate('serviceAccount.json')
# many instances of the app with some random number name 1-100000
    randomName = random.randrange(1,100000,1)
    if not firebase_admin._apps: # there must be a default app created
        firebase_admin.initialize_app(cred)
     
    else: # if there is already a message running thru, create a different app with random name
        firebase_admin.initialize_app(cred, name=f'{randomName}')  
    
    inp = str(data['value']['fields']['input']['stringValue']) # retrieve input
    inp = 'trivia question: ' + inp #format to fit the T5 model
    collec = str(data['value']['fields']['collection']['stringValue']) # get the collection of origination
    doc = str(data['value']['fields']['doc']['stringValue']) # get the document of origination
    
    saved_model_path = 'gs://t5base/models/base/export/1637053095/' # get the model
    predict_fn = load_predict_fn(saved_model_path) # load the function
    answer = predict_fn([inp])[0].decode('utf-8') # decode an answer
    db = firestore.client()
    messageRef = db.collection(f'{collec}')
    docRef = messageRef.document(f'{doc}')
    docRef.update({'botResponse' : answer}) # store the answer in the corresponding msg botresponse
    print(answer)

def load_predict_fn(model_path):
     imported = tf.saved_model.load(model_path, ["serve"])
     return lambda x: imported.signatures['serving_default'](tf.constant(x))['outputs'].numpy()