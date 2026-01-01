const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { authenticate } = require('../middleware/auth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Extract tasks from text
router.post('/extract-tasks', authenticate, async (req, res) => {
  try {
    const { text, context } = req.body;
    
    const prompt = `
      Extract tasks from the following text. Return as JSON array with:
      - title (string)
      - priority (high/medium/low)
      - estimated_duration_minutes (number)
      - due_date (ISO string if mentioned)
      
      Text: ${text}
      Context: ${context || 'general'}
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a task extraction expert. Return valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const tasks = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, tasks });
    
  } catch (error) {
    console.error('Error extracting tasks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to extract tasks' 
    });
  }
});

// Summarize meeting transcript
router.post('/summarize-meeting', authenticate, async (req, res) => {
  try {
    const { transcript, duration } = req.body;
    
    const prompt = `
      Summarize this meeting transcript and extract action items.
      
      Transcript:
      ${transcript}
      
      Meeting duration: ${duration} minutes
      
      Return JSON with:
      - summary (string)
      - key_points (array)
      - action_items (array of objects with: assignee, task, due_date)
      - next_steps (array)
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a meeting summarizer. Return valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    const summary = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, summary });
    
  } catch (error) {
    console.error('Error summarizing meeting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to summarize meeting' 
    });
  }
});

module.exports = router;