const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/enhance-description', authenticate, async (req, res) => {
  const { title, notes, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI service not configured' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const prompt = `You are an innovation consultant helping employees write compelling idea submissions for an internal innovation platform called BuildBoard.

Given the following idea details, write a clear, professional description (150-250 words) that covers:
1. The problem being solved
2. The proposed solution
3. Expected impact and benefits

Keep the tone professional but enthusiastic. Do not use markdown formatting, bullet points, or headers — write in plain flowing paragraphs.

Title: ${title}
Category: ${category || 'General'}
${notes ? `Additional notes from the submitter: ${notes}` : ''}

Write the description now:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ description: text.trim() });
  } catch (err) {
    console.error('[ai] Gemini error:', err.message);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

module.exports = router;
