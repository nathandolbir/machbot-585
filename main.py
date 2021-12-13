import tensorflow as tf
import tensorflow_text
import numpy
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import random
from transformers import AutoTokenizer, TFAutoModelForSequenceClassification,TFPreTrainedModel
import contractions
import requests
from google.cloud import storage

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
    answer = predict_fn([inp])[0].decode('utf-8')
    #answer = ''
    
    db = firestore.client()
    dialogRef = db.collection('dialog') 
    modelsRef = dialogRef.document('Models')
    models = modelsRef.get()

    #https://stackoverflow.com/questions/48392457/loading-saved-keras-model-from-gs-to-pydatalab
    if(models.to_dict()['DistilBERT']):
      storage_client = storage.Client()
      bucket = storage_client.get_bucket('emotion-models')
      blob_weights = bucket.blob('DistilBert/DistilBertWeights.h5')
      blob_weights.download_to_filename('/tmp/Weights.h5')
      emotionModel = PredictEmotion('distilbert-base-uncased',
                              '/tmp/Weights.h5')
      emotionOutput,emotionProb = emotionModel.PredictTextEmotion(str(data['value']['fields']['input']['stringValue']))
      answer+= '-|- DistilBERT,Emotion: '+ emotionOutput +' emotionProb: '+str(emotionProb)
      pass
    if(models.to_dict()['BERT']):
      storage_client = storage.Client()
      bucket = storage_client.get_bucket('emotion-models')
      blob_weights = bucket.blob('Bert/BertWeights.h5')
      blob_weights.download_to_filename('/tmp/Weights.h5')
      emotionModel = PredictEmotion('bert-base-uncased',
                              '/tmp/Weights.h5')
      emotionOutput,emotionProb = emotionModel.PredictTextEmotion(str(data['value']['fields']['input']['stringValue']))
      answer+= '-|- Bert,Emotion: '+ emotionOutput +' emotionProb: '+str(emotionProb)
      pass
      
    if(models.to_dict()['RoBERTa']):
      storage_client = storage.Client()
      bucket = storage_client.get_bucket('emotion-models')
      blob_weights = bucket.blob('Roberta/RobertaWeights.h5')
      blob_weights.download_to_filename('/tmp/Weights.h5')
      emotionModel = PredictEmotion('roberta-base',
                                '/tmp/Weights.h5')
      emotionOutput,emotionProb = emotionModel.PredictTextEmotion(str(data['value']['fields']['input']['stringValue']))
      answer+= '-|- Roberta,Emotion: '+ emotionOutput +' emotionProb: '+str(emotionProb)
    
    if(models.to_dict()['Electra']):
      storage_client = storage.Client()
      bucket = storage_client.get_bucket('emotion-models')
      blob_weights = bucket.blob('Electra/ElectraWeights.h5')
      blob_weights.download_to_filename('/tmp/Weights.h5')
      emotionModel = PredictEmotion('google/electra-small-discriminator',
                                '/tmp/Weights.h5')
      emotionOutput,emotionProb = emotionModel.PredictTextEmotion(str(data['value']['fields']['input']['stringValue']))
      answer+= '-|- Electra,Emotion: '+ emotionOutput +' emotionProb: '+str(emotionProb)
    if(models.to_dict()['MobileBERT']):
      storage_client = storage.Client()
      bucket = storage_client.get_bucket('emotion-models')
      blob_weights = bucket.blob('MobileBert/MobileBertWeights.h5')
      blob_weights.download_to_filename('/tmp/Weights.h5')
      emotionModel = PredictEmotion('google/mobilebert-uncased',
                                '/tmp/Weights.h5')
      emotionOutput,emotionProb = emotionModel.PredictTextEmotion(str(data['value']['fields']['input']['stringValue']))
      answer+= '-|- MobileBert,Emotion: '+ emotionOutput +' emotionProb: '+str(emotionProb)


    db = firestore.client()
    messageRef = db.collection(f'{collec}')
    docRef = messageRef.document(f'{doc}')
    docRef.update({'botResponse' : answer}) # store the answer in the corresponding msg botresponse
    print(answer)

def load_predict_fn(model_path):
     imported = tf.saved_model.load(model_path, ["serve"])
     return lambda x: imported.signatures['serving_default'](tf.constant(x))['outputs'].numpy()

class PredictEmotion:
  
  def __init__(self,
               modelName, 
               modelPath,
               isTokenizerFast = False, 
               numLabels = 6):
    
    self.modelName = modelName
    self.modelPath = modelPath
    self.isTokenizerFast = isTokenizerFast
    self.numLabels = numLabels
    self.model = self.MakeModelArchitecture()
    self.loadModelWeights()
    self.tokenizer = self.makeTokenizer()
    # self.spell = Speller(lang='en')
    self.emotionTypes = ['anger', 'fear', 'joy', 'love', 'sadness', 'surprise','other']

  def MakeModelArchitecture(self):
    model = TFAutoModelForSequenceClassification.from_pretrained(self.modelName,
                                                                 num_labels =6)
    input_ids = tf.keras.layers.Input(shape=(200,),name="input_ids", dtype='int32')
    mask = tf.keras.layers.Input(shape=(200,),name="attention_mask",dtype='int32')
    embeddings = model(input_ids,attention_mask=mask)[0]
    layer = tf.keras.layers.Dense(1000,activation='relu')(embeddings)
    layer = tf.keras.layers.BatchNormalization()(layer)
    outputLayer = tf.keras.layers.Dense(6,activation='softmax',name='outputs')(layer)
    ModelArchitecture = tf.keras.Model(inputs=[input_ids,mask],outputs=outputLayer)
    return ModelArchitecture

  def loadModelWeights(self):
    self.model.load_weights(self.modelPath)
  
  def makeTokenizer(self):
    return AutoTokenizer.from_pretrained(self.modelName)
  
  def TextPrepration(self,text):
    DecontractedText = contractions.fix(text)
    # SpelledText = str(self.spell(DecontractedText))
    textEncodings = self.tokenizer(DecontractedText,
                            truncation=True, 
                            max_length = 200,
                            padding="max_length", 
                            return_tensors='tf')
    return {
      'input_ids': tf.cast(textEncodings['input_ids'],tf.int32),
      'attention_mask': tf.cast(textEncodings['attention_mask'],tf.int32)}

  def PredictTextEmotion(self,text):
    prepratedText = self.TextPrepration(text)
    emotion = self.model.predict(prepratedText) 
    predictedEmotion = numpy.argmax(emotion)
    highestProb = emotion[0][predictedEmotion]
    return self.emotionTypes[predictedEmotion],highestProb