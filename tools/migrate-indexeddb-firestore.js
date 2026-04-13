/**
 * Client-side migration helper spec.
 * This file documents and provides pure mapping functions used by runtime migration.
 */

function toTimestampParts(date, time = '00:00') {
  if (!date) return null;
  return `${date}T${time}:00`;
}

function mapLegacyEventToFirestore(ev, uid) {
  return {
    ownerId: uid,
    title: ev.name || 'Untitled Event',
    description: ev.description || '',
    eventType: ev.eventType || 'hosted',
    visibility: 'private',
    locationText: ev.location || '',
    geo: ev.geo || null,
    startAt: toTimestampParts(ev.date, ev.startTime || '09:00'),
    endAt: toTimestampParts(ev.date, ev.endTime || '11:00'),
    timezone: ev.timezone || 'UTC',
    tags: Array.isArray(ev.tags) ? ev.tags : [],
    mediaCount: Array.isArray(ev.photos) ? ev.photos.length : 0,
    ticketing: {
      enabled: Number(ev.ticketPrice) > 0,
      price: Number(ev.ticketPrice) || 0,
      currency: 'NGN'
    },
    metrics: {
      likes: Number(ev.promoLikes) || 0,
      comments: Number(ev.promoComments) || 0,
      shares: Number(ev.promoShares) || 0,
      views: Number(ev.promoViews) || 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

module.exports = {
  mapLegacyEventToFirestore
};
