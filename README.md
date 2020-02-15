FireBaseTimestampUpdate
=======================

Synchronizes a queryable time field with internal updateTime.

Firestore maintains a hidden internal \_updateTime for every document, but this
is not straightforward to access, and is not queryable. The purpose of this
project is to be able to query Firebase documents on that timestamp. The
approach is to use "Firebase Functions" (server-side Javascript) to
automatically copy the internal timestamp to a visible field, every time a
document is created or updated.

Technically, this is "Cloud Firestore" rather than "Realtime Database".

To set up Firebase Functions, this tutorial was helpful:

<https://firebase.google.com/docs/functions/get-started>

On Windows 10, the command line that worked was the new Bash shell, available
since about 2017. The GIT Bash shell, otherwise very useful, was not able to
track screen positions during Firebase project setup.

The initial commit is heavily commented, somewhat redundant, and has a great
number of 'console.log' statements, to show detail. Not obvious at first was
where these console logs go. They do not go to the command line, but to the
Firebase console:

<https://console.firebase.google.com/u/0/>

under (yourproject) \> Functions \> Logs

For testing, I found it useful to, at first, deploy only one function (this is
in the CLI):

firebase deploy --only functions:testFn

To remove such a test function, when done with it; in the Firebase console:

(yourproject) \> Functions \> Dashboard

Then float over the right end of the function item, a 3-dots menu will appear,
and one of the options will be "Delete function".
