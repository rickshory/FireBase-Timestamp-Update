// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Firestore maintains an internal _updateTime for every document, but this is
// not queryable. This function copies that to a visible field 'Updated'
exports.makeUpdateTimeVisible = functions.firestore
      .document('NRCSSpp/{sppId}')
      .onWrite((sppDoc, context) => {
  console.log("Event type: ", context.eventType);
  // context.eventType = 'google.firestore.document.write', so cannot use
  // to distinguish e.g. create from update
  const docName = context.params.sppId // this is how to get the document name
  console.log("Before: ", sppDoc.before); // if a create, a 'DocumentSnapshot',
  // otherwise a 'QueryDocumentSnapshot'
  // if a create, everything about sppDoc.before is undefined
  if (typeof sppDoc.before._fieldsProto === "undefined"){
    console.log('document "', docName, '" has been created');
    // set flags here if desired
  }
  console.log("After: ", sppDoc.after); // if a delete, a 'DocumentSnapshot',
  // otherwise a 'QueryDocumentSnapshot'
  // if a delete, everything about sppDoc.after is undefined
  if (typeof sppDoc.after._fieldsProto === "undefined"){
    console.log('document "', docName, '" has been deleted');
    // other fields could be fetched from sppDoc.before
    return null; // no need to proceed
  }
  console.log(sppDoc.after.data()); // the user defined fields:values
  // inside curly braces
  console.log(sppDoc.after._fieldsProto); // similar to previous except with
  // data types, e.g.
  // data() has { Code: 'OLDO',...
  // _fieldsProto has { Code: { stringValue: 'OLDO' },...
  const timeJustUpdated = sppDoc.after._updateTime; // this is how to get the
  // internal nonqueryable timestamp
  console.log(timeJustUpdated);
  //            Timestamp { _seconds: 1581615533, _nanoseconds: 496655000 }
  //  later:    Timestamp { _seconds: 1581617552, _nanoseconds: 566223000 }
  // so, this is correctly updating
  // see if the doc has the 'Updated' field yet
  if (sppDoc.after._fieldsProto.hasOwnProperty('Updated')) {
    console.log("doc has the field 'Updated' with the value",
                  sppDoc.after._fieldsProto.Updated);
    console.log("sppDoc:", sppDoc);
    const secondsInternal = timeJustUpdated._seconds;
    console.log(secondsInternal, "seconds, internal timestamp");
    const secondsExternal = sppDoc.after.data().Updated._seconds;
    console.log(secondsExternal, "seconds, external timestamp");
    // Careful here. If we just update the externally visible time to the
    // internal time, we will go into an infinite loop because that update
    // will call this function again, and by then the internal time will have
    // advanced
    // the following exit will not work:
    if (secondsInternal === secondsExternal) return null; // will never exit
    // instead, allow the external time to lag the internal by a little
    const secondsLate = secondsInternal - secondsExternal;
    if (secondsLate < 120) { // two minutes sufficient for my purposes
      console.log("the field 'Updated' is", secondsLate,
                  "seconds late, good enough");
       return null;
    }
    console.log("the field 'Updated' is", secondsLate,
                  "seconds late, updating");
    // return a promise of a set operation to update the timestamp
    return sppDoc.after.ref.set({
      Updated: timeJustUpdated
    }, {merge: true});
    // this change will call this same function again
  } else {
    console.log("doc does not have the field 'Updated', adding it now.");
    // return a promise of a set operation to create the timestamp
    return sppDoc.after.ref.set({
      Updated: timeJustUpdated
    }, {merge: true});
    // this change will call this same function again
  }
});
