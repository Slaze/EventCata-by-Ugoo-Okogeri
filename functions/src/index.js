const admin = require('firebase-admin');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();
const db = admin.firestore();

exports.onTicketCreated = onDocumentCreated('events/{eventId}/tickets/{ticketId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const ticket = snap.data();
  const eventId = event.params.eventId;

  const eventRef = db.collection('events').doc(eventId);
  await db.runTransaction(async (tx) => {
    const eventDoc = await tx.get(eventRef);
    const metrics = (eventDoc.data() && eventDoc.data().metrics) || {};
    const qty = Number(ticket.qty) || 0;
    const revenue = Number(ticket.totalPrice) || 0;
    tx.set(
      eventRef,
      {
        metrics: {
          ...metrics,
          ticketsSold: (Number(metrics.ticketsSold) || 0) + qty,
          ticketRevenue: (Number(metrics.ticketRevenue) || 0) + revenue
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });
});

exports.onPostWrittenModeration = onDocumentWritten('events/{eventId}/posts/{postId}', async (event) => {
  const after = event.data.after;
  if (!after.exists) return;
  const data = after.data() || {};
  const text = String(data.text || '').toLowerCase();
  const banned = ['spam', 'scam', 'hate'];
  const flagged = banned.some((w) => text.includes(w));
  if (!flagged) return;
  await after.ref.set(
    {
      moderation: {
        status: 'flagged',
        reason: 'keyword_match'
      }
    },
    { merge: true }
  );
});

exports.onEventWrittenFeedFanout = onDocumentWritten('events/{eventId}', async (event) => {
  const after = event.data.after;
  if (!after.exists) return;
  const data = after.data() || {};
  const ownerId = data.ownerId;
  if (!ownerId) return;

  const followersSnap = await db.collection('follows').doc(ownerId).collection('followers').get();
  const batch = db.batch();
  const payload = {
    type: event.data.before.exists ? 'event_updated' : 'event_created',
    actorId: ownerId,
    eventId: after.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  followersSnap.forEach((doc) => {
    const uid = doc.id;
    const feedRef = db.collection('feeds').doc(uid).collection('items').doc();
    batch.set(feedRef, payload);
  });
  await batch.commit();
});

exports.purchaseTicket = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const { eventId, qty } = req.data || {};
  if (!eventId) throw new HttpsError('invalid-argument', 'eventId required');
  const safeQty = Math.max(1, Math.min(10, Number(qty) || 1));

  const eventRef = db.collection('events').doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) throw new HttpsError('not-found', 'Event not found');
  const ev = eventSnap.data() || {};
  const unitPrice = Number(ev.ticketing?.price) || 0;
  const totalPrice = unitPrice * safeQty;

  const ticketRef = eventRef.collection('tickets').doc();
  await ticketRef.set({
    buyerId: req.auth.uid,
    qty: safeQty,
    unitPrice,
    totalPrice,
    currency: ev.ticketing?.currency || 'NGN',
    status: 'paid',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true, ticketId: ticketRef.id, totalPrice };
});
