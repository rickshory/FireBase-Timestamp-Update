// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Firestore maintains an internal _updateTime for every document, but it is
// not queryable. This function copies that to a visible field 'Updated'
exports.makeUpdateTimeVisible = functions.firestore
      .document('NRCSSpp/{sppId}')
      .onWrite((sppDoc, context) => {
  const docName = context.params.sppId // get document name, same as spp Code
  // if a delete, everything about sppDoc.after is undefined
  if (typeof sppDoc.after._fieldsProto === "undefined"){
    console.log(docName, 'has been deleted');
    // data available in sppDoc.before
    return null; // no need to proceed
  }
  const timeJustUpdated = sppDoc.after._updateTime; // get the internal timestamp
  if (sppDoc.after._fieldsProto.hasOwnProperty('Updated')) {
    const secondsInternal = timeJustUpdated._seconds;
    const secondsExternal = sppDoc.after.data().Updated._seconds;
    // if the exit test were (external===internal), it would cause an
    // infinite loop because each update calls this function again, and by
    // the next iteration internnal time will have advanced
    // allow external time to lag internal by a little
    const secondsLate = secondsInternal - secondsExternal;
    if (secondsLate < 30) { // sufficient for this purpose
      console.log(docName, "field 'Updated' is", secondsLate,
                  "seconds late, OK");
       return null;
    }
    console.log(docName, "field 'Updated' is", secondsLate,
                  "seconds late, updating");
    // drop through to default return
  } else {
    console.log(docName, "has no field 'Updated', adding it now.");
    // drop through to default return
  }
  // same 'set' for either creating the field 'Updated' the first time in a
  // newly created document, or updating this field in an existing document when
  // the timestamp is too old
  // return a promise
  return sppDoc.after.ref.set({
    Updated: timeJustUpdated
  }, {merge: true}); // 'merge' prevents overwrite of the whole doc
  // this change will call this same function again
});
