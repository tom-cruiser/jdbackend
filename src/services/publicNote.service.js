const crypto = require('crypto');
const mongo = require('../db/mongo');

const NOTE_ID = 'public_app_note';

class PublicNoteService {
  async getCurrentNote() {
    await mongo.connect();
    const { app_notes } = mongo.getCollections();
    return app_notes.findOne({ _id: NOTE_ID });
  }

  async getPublicNote() {
    const note = await this.getCurrentNote();
    if (!note || !note.is_active) return null;
    return note;
  }

  async upsertNote(noteData, profile) {
    await mongo.connect();
    const { app_notes } = mongo.getCollections();

    const now = new Date();
    const payload = {
      _id: NOTE_ID,
      title: noteData.title || '',
      content: noteData.content,
      is_active: noteData.is_active !== false,
      updated_at: now,
      updated_by: profile?._id || profile?.id || null,
      updated_by_name: profile?.full_name || profile?.email || 'Admin',
    };

    await app_notes.updateOne(
      { _id: NOTE_ID },
      {
        $set: payload,
        $setOnInsert: {
          created_at: now,
          created_token: crypto.randomUUID(),
        },
      },
      { upsert: true }
    );

    return this.getCurrentNote();
  }
}

module.exports = new PublicNoteService();
