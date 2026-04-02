const supabase = require('../db');

async function notify(userId, title, message, type = 'info', ideaId = null) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId, title, message, type, idea_id: ideaId
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

async function notifyMultiple(userIds, title, message, type = 'info', ideaId = null) {
  const inserts = userIds.map(uid => ({
    user_id: uid, title, message, type, idea_id: ideaId
  }));
  try {
    await supabase.from('notifications').insert(inserts);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

module.exports = { notify, notifyMultiple };
