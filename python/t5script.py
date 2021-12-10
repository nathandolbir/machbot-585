from google.colab import auth
auth.authenticate_user()

import tensorflow as tf
import tensorflow_text  # Required to run exported model.

def load_predict_fn(model_path):
  if tf.executing_eagerly():
    print("Loading SavedModel in eager mode.")
    imported = tf.saved_model.load(model_path, ["serve"])
    return lambda x: imported.signatures['serving_default'](tf.constant(x))['outputs'].numpy()
  else:
    print("Loading SavedModel in tf 1.x graph mode.")
    tf.compat.v1.reset_default_graph()
    sess = tf.compat.v1.Session()
    meta_graph_def = tf.compat.v1.saved_model.load(sess, ["serve"], model_path)
    signature_def = meta_graph_def.signature_def["serving_default"]
    return lambda x: sess.run(
        fetches=signature_def.outputs["outputs"].name, 
        feed_dict={signature_def.inputs["inputs"].name: x}
    )
saved_model_path = ""
predict_fn = load_predict_fn(saved_model_path)