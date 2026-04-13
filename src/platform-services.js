/* EventCata platform services (Firebase-first). */

export function createPlatformServices(firebaseApp) {
  const auth = firebase.auth(firebaseApp);
  const db = firebase.firestore(firebaseApp);

  async function upsertProfile(uid, payload) {
    await db.collection('users').doc(uid).set(
      {
        ...payload,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }

  async function followUser(uid, targetUid) {
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.set(db.collection('follows').doc(uid).collection('following').doc(targetUid), { createdAt: now });
    batch.set(db.collection('follows').doc(targetUid).collection('followers').doc(uid), { createdAt: now });
    await batch.commit();
  }

  async function unfollowUser(uid, targetUid) {
    const batch = db.batch();
    batch.delete(db.collection('follows').doc(uid).collection('following').doc(targetUid));
    batch.delete(db.collection('follows').doc(targetUid).collection('followers').doc(uid));
    await batch.commit();
  }

  function streamFeed(uid, onItems) {
    return db.collection('feeds').doc(uid).collection('items')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .onSnapshot((snap) => {
        onItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
  }

  async function addEventPost(eventId, payload) {
    await db.collection('events').doc(eventId).collection('posts').add({
      ...payload,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function reactToPost(eventId, postId, uid, reaction) {
    await db.collection('events').doc(eventId).collection('posts').doc(postId).collection('reactions').doc(uid).set({
      reaction,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function reportPost(eventId, postId, uid, reason) {
    await db.collection('events').doc(eventId).collection('posts').doc(postId).collection('reports').doc(uid).set({
      reason,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  return {
    auth,
    db,
    upsertProfile,
    followUser,
    unfollowUser,
    streamFeed,
    addEventPost,
    reactToPost,
    reportPost
  };
}
