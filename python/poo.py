import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.Certificate('serviceAccount.json')
firebase_admin.initialize_app(cred)
db = firestore.client()
dialogRef = db.collection('dialog') 
modelsRef = dialogRef.document('Models')
models = modelsRef.get()
print(models.to_dict()['DistilBERT'])