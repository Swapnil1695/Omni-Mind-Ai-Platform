const { OpenAI } = require('openai');
const { query } = require('../utils/database');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.models = {
      taskExtraction: 'gpt-4',
      summarization: 'gpt-4',
      scheduling: 'gpt-4',
      basic: 'gpt-3.5-turbo',
    };
  }

  async extractTasksFromText(text, context = {}) {
    try {
      const prompt = `
You are an expert task extraction assistant. Extract actionable tasks from the following text.

Text: "${text}"

Context:
- Source: ${context.source || 'general'}
- Current Date: ${new Date().toISOString().split('T')[0]}
- User Timezone: ${context.timezone || 'UTC'}

Extract tasks and return as JSON array. Each task should have:
- title (string): Clear, actionable task title
- description (string): More details about the task
- priority (string: "high", "medium", or "low"): Based on urgency and importance
- estimated_duration_minutes (number): Estimated time to complete
- due_date (string in ISO format): If mentioned, extract date. If not, leave null
- category (string): "work", "personal", "meeting", "email", "other"
- assignee (string): If mentioned, who should do it. Default to "me"

If no tasks are found, return empty array [].

Only return valid JSON. No other text.
      `;

      const completion = await this.openai.chat.completions.create({
        model: this.models.taskExtraction,
        messages: [
          { role: "system", content: "You extract tasks from text and return valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      return response.tasks || [];
    } catch (error) {
      logger.error('Error extracting tasks:', error);
      throw new Error('Failed to extract tasks');
    }
  }

  async summarizeMeeting(transcript, duration, participants = []) {
    try {
      const prompt = `
You are a meeting summarization expert. Summarize this meeting and extract action items.

Meeting Transcript:
"""
${transcript}
"""

Meeting Details:
- Duration: ${duration} minutes
- Participants: ${participants.join(', ')}
- Date: ${new Date().toISOString().split('T')[0]}

Provide a comprehensive summary in JSON format with:
- summary (string): 2-3 paragraph summary of key discussion points
- key_decisions (array): List of decisions made
- action_items (array of objects): Each with:
  * task (string): Action item description
  * assignee (string): Person responsible
  * due_date (string): Deadline in ISO format
  * priority (string: "high", "medium", "low")
- next_steps (array): What needs to happen next
- follow_up_meeting (object or null): If needed, with topic and suggested_date

Only return valid JSON. No other text.
      `;

      const completion = await this.openai.chat.completions.create({
        model: this.models.summarization,
        messages: [
          { role: "system", content: "You summarize meetings and extract action items. Return valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      logger.error('Error summarizing meeting:', error);
      throw new Error('Failed to summarize meeting');
    }
  }

  async optimizeSchedule(tasks, constraints = {}) {
    try {
      const prompt = `
Optimize this schedule considering tasks and constraints.

Tasks (in JSON format):
${JSON.stringify(tasks, null, 2)}

Constraints:
- Available hours per day: ${constraints.availableHours || 8}
- Focus hours: ${constraints.focusHours || '09:00-12:00'}
- Breaks: ${constraints.breakDuration || '30 minutes'} lunch, ${constraints.shortBreak || '5 minutes'} short breaks every hour
- Avoid scheduling: ${constraints.avoidTimes || 'none'}
- User preferences: ${JSON.stringify(constraints.preferences || {})}

Create an optimized schedule for the next 7 days. Return JSON with:
- daily_schedule (array of objects for each day):
  * date (string)
  * tasks (array of scheduled tasks with start_time, end_time, and task_id)
  * total_hours (number)
  * focus_time_utilization (percentage)
- recommendations (array): Suggestions for better productivity
- warnings (array): If any tasks can't be scheduled

Only return valid JSON. No other text.
      `;

      const completion = await this.openai.chat.completions.create({
        model: this.models.scheduling,
        messages: [
          { role: "system", content: "You are a scheduling optimization expert. Return valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      logger.error('Error optimizing schedule:', error);
      throw new Error('Failed to optimize schedule');
    }
  }

  async analyzeProductivityPatterns(userId, days = 30) {
    try {
      // Get user's task data
      const tasksResult = await query(
        `SELECT 
           DATE(created_at) as date,
           status,
           priority,
           estimated_duration,
           actual_duration,
           EXTRACT(DOW FROM created_at) as day_of_week
         FROM tasks 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
         ORDER BY created_at`,
        [userId]
      );

      if (tasksResult.rows.length === 0) {
        return { patterns: {}, suggestions: [] };
      }

      const prompt = `
Analyze this productivity data and provide insights:

Task Data (in JSON):
${JSON.stringify(tasksResult.rows, null, 2)}

Analyze and return JSON with:
- patterns (object):
  * most_productive_days (array of day names)
  * average_completion_rate (percentage)
  * common_task_types (array)
  * time_estimation_accuracy (percentage)
  * priority_distribution (object with high/medium/low percentages)
- suggestions (array): Specific, actionable suggestions for improvement
- predicted_productivity_score (number 1-100)
- recommended_focus_times (array of best times to work based on patterns)

Only return valid JSON. No other text.
      `;

      const completion = await this.openai.chat.completions.create({
        model: this.models.basic,
        messages: [
          { role: "system", content: "You are a productivity analyst. Return valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      logger.error('Error analyzing productivity patterns:', error);
      throw new Error('Failed to analyze productivity patterns');
    }
  }

  async generateEmailResponse(emailContent, tone = 'professional') {
    try {
      const prompt = `
Generate a ${tone} email response based on this email:

Email Content:
"""
${emailContent}
"""

Generate a response that:
1. Acknowledges the email
2. Addresses any questions or requests
3. Provides necessary information
4. Suggests next steps if needed
5. Closes politely

Return JSON with:
- subject (string): Suggested subject line
- body (string): Complete email body
- key_points (array): Main points covered
- suggested_follow_up (string or null): If follow-up is needed

Only return valid JSON. No other text.
      `;

      const completion = await this.openai.chat.completions.create({
        model: this.models.basic,
        messages: [
          { role: "system", content: "You are an email writing assistant. Return valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      logger.error('Error generating email response:', error);
      throw new Error('Failed to generate email response');
    }
  }

  async detectConflictsAndSuggestions(userId) {
    try {
      // Get upcoming tasks and meetings
      const tasksResult = await query(
        `SELECT id, title, due_date, priority, estimated_duration
         FROM tasks 
         WHERE user_id = $1 
           AND status != 'completed'
           AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'`,
        [userId]
      );

      const meetingsResult = await query(
        `SELECT id, title, start_time, end_time
         FROM meetings 
         WHERE user_id = $1 
           AND start_time BETWEEN NOW() AND NOW() + INTERVAL '7 days'`,
        [userId]
      );

      const prompt = `
Analyze these upcoming items for conflicts and provide suggestions:

Upcoming Tasks:
${JSON.stringify(tasksResult.rows, null, 2)}

Upcoming Meetings:
${JSON.stringify(meetingsResult.rows, null, 2)}

Analyze and return JSON with:
- conflicts (array of objects):
  * type (string): "time_conflict", "priority_conflict", "workload_conflict"
  * description (string)
  * items_involved (array of item IDs)
  * severity (string: "high", "medium", "low")
- suggestions (array of objects):
  * type (string): "reschedule", "delegate", "break_down", "prioritize"
  * description (string)
  * items_affected (array of item IDs)
  * estimated_benefit (string)
- workload_assessment (object):
  * total_hours_required (number)
  * available_hours (number, default 40)
  * overload_percentage (number)
  * recommended_adjustments (array)

Only return valid JSON. No other text.
      `;

      const completion = await this.openai.chat.completions.create({
        model: this.models.taskExtraction,
        messages: [
          { role: "system", content: "You are a scheduling conflict detection system. Return valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      logger.error('Error detecting conflicts:', error);
      throw new Error('Failed to detect conflicts');
    }
  }

  async queueAITask(userId, type, inputData) {
    try {
      const result = await query(
        `INSERT INTO ai_processing_queue (user_id, type, input_data)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, type, inputData]
      );

      // Process in background (simplified - in real app, use job queue)
      this.processQueuedTask(result.rows[0].id);

      return result.rows[0];
    } catch (error) {
      logger.error('Error queuing AI task:', error);
      throw error;
    }
  }

  async processQueuedTask(taskId) {
    try {
      // Get task from queue
      const taskResult = await query(
        'SELECT * FROM ai_processing_queue WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found in queue');
      }

      const task = taskResult.rows[0];

      // Update status to processing
      await query(
        'UPDATE ai_processing_queue SET status = $1 WHERE id = $2',
        ['processing', taskId]
      );

      let outputData;
      
      // Process based on type
      switch (task.type) {
        case 'extract_tasks':
          outputData = await this.extractTasksFromText(
            task.input_data.text,
            task.input_data.context
          );
          break;
          
        case 'summarize_meeting':
          outputData = await this.summarizeMeeting(
            task.input_data.transcript,
            task.input_data.duration,
            task.input_data.participants
          );
          break;
          
        case 'optimize_schedule':
          outputData = await this.optimizeSchedule(
            task.input_data.tasks,
            task.input_data.constraints
          );
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      // Update with results
      await query(
        `UPDATE ai_processing_queue 
         SET status = $1, output_data = $2, processed_at = NOW()
         WHERE id = $3`,
        ['completed', outputData, taskId]
      );

      logger.info(`AI task completed: ${task.type} for user ${task.user_id}`);

    } catch (error) {
      logger.error('Error processing AI task:', error);
      
      // Update with error
      await query(
        `UPDATE ai_processing_queue 
         SET status = $1, error_message = $2, retry_count = retry_count + 1
         WHERE id = $3`,
        ['failed', error.message, taskId]
      );

      // Retry logic (simplified)
      const taskResult = await query(
        'SELECT retry_count FROM ai_processing_queue WHERE id = $1',
        [taskId]
      );
      
      if (taskResult.rows[0].retry_count < 3) {
        // Retry after delay
        setTimeout(() => this.processQueuedTask(taskId), 5000);
      }
    }
  }
}

module.exports = new AIService();