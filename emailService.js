const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    this.templates = {
      welcome: {
        subject: 'Welcome to OmniMind!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to OmniMind!</h1>
                <p>Your AI-powered productivity assistant</p>
              </div>
              <div class="content">
                <h2>Hello {{name}},</h2>
                <p>Thank you for joining OmniMind! We're excited to help you boost your productivity with AI-powered assistance.</p>
                
                <h3>Getting Started:</h3>
                <ol>
                  <li><strong>Connect your accounts:</strong> Link your email and calendar for automatic task extraction</li>
                  <li><strong>Try the Chrome extension:</strong> Extract tasks directly from Gmail</li>
                  <li><strong>Set up your first project:</strong> Organize your work in one place</li>
                  <li><strong>Enable notifications:</strong> Stay on top of important deadlines</li>
                </ol>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
                </div>
                
                <p>Need help? Check out our <a href="{{helpUrl}}">documentation</a> or reply to this email.</p>
                
                <p>Best regards,<br>The OmniMind Team</p>
              </div>
              <div class="footer">
                <p>© 2024 OmniMind. All rights reserved.</p>
                <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{privacyUrl}}">Privacy Policy</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      taskReminder: {
        subject: 'Task Reminder: {{taskTitle}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; color: white; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 25px; background: #fff7ed; border-radius: 0 0 10px 10px; }
              .task-card { background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .priority-high { border-left-color: #ef4444; }
              .priority-medium { border-left-color: #f59e0b; }
              .priority-low { border-left-color: #10b981; }
              .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .footer { text-align: center; margin-top: 25px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>⏰ Task Reminder</h2>
              </div>
              <div class="content">
                <h3>Hello {{name}},</h3>
                <p>This is a reminder for your upcoming task:</p>
                
                <div class="task-card priority-{{taskPriority}}">
                  <h4 style="margin: 0 0 10px 0;">{{taskTitle}}</h4>
                  {{#if taskDescription}}<p style="margin: 0 0 10px 0; color: #6b7280;">{{taskDescription}}</p>{{/if}}
                  <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span><strong>Due:</strong> {{dueDate}}</span>
                    <span><strong>Priority:</strong> {{taskPriority}}</span>
                  </div>
                  {{#if projectName}}<p style="margin: 10px 0 0 0;"><strong>Project:</strong> {{projectName}}</p>{{/if}}
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="{{taskUrl}}" class="button">View Task</a>
                </div>
                
                <p>Need to reschedule? You can update the due date in the dashboard.</p>
                
                <p>Best regards,<br>The OmniMind Team</p>
              </div>
              <div class="footer">
                <p>Manage your notification settings <a href="{{settingsUrl}}">here</a></p>
                <p>© 2024 OmniMind. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      dailyDigest: {
        subject: 'Your Daily Digest - {{date}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 25px; color: white; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 25px; background: #f0f9ff; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .task-item { padding: 10px; border-bottom: 1px solid #e5e7eb; }
              .task-item:last-child { border-bottom: none; }
              .priority-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
              .priority-high { background-color: #ef4444; }
              .priority-medium { background-color: #f59e0b; }
              .priority-low { background-color: #10b981; }
              .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
              .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
              .stat-number { font-size: 24px; font-weight: bold; }
              .stat-label { font-size: 14px; color: #6b7280; }
              .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .footer { text-align: center; margin-top: 25px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>📊 Your Daily Digest</h2>
                <p>{{date}} | {{dayName}}</p>
              </div>
              <div class="content">
                <h3>Good morning, {{name}}!</h3>
                <p>Here's your productivity overview for today:</p>
                
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-number">{{taskStats.total}}</div>
                    <div class="stat-label">Total Tasks</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">{{taskStats.completed}}</div>
                    <div class="stat-label">Completed</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">{{taskStats.overdue}}</div>
                    <div class="stat-label">Overdue</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">{{taskStats.dueToday}}</div>
                    <div class="stat-label">Due Today</div>
                  </div>
                </div>
                
                <div class="section">
                  <h4>🎯 Today's Priorities</h4>
                  {{#each priorities}}
                  <div class="task-item">
                    <span class="priority-dot priority-{{priority}}"></span>
                    <strong>{{title}}</strong>
                    {{#if project}}<span style="color: #6b7280; font-size: 14px;"> - {{project}}</span>{{/if}}
                    <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                      {{#if dueDate}}Due: {{dueDate}}{{/if}}
                    </div>
                  </div>
                  {{/each}}
                </div>
                
                {{#if meetings.length}}
                <div class="section">
                  <h4>📅 Today's Meetings</h4>
                  {{#each meetings}}
                  <div class="task-item">
                    <strong>{{title}}</strong>
                    <div style="font-size: 14px; color: #6b7280;">
                      ⏰ {{time}} | {{duration}}
                    </div>
                  </div>
                  {{/each}}
                </div>
                {{/if}}
                
                {{#if suggestions.length}}
                <div class="section">
                  <h4>💡 AI Suggestions</h4>
                  <ul>
                    {{#each suggestions}}
                    <li>{{this}}</li>
                    {{/each}}
                  </ul>
                </div>
                {{/if}}
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="{{dashboardUrl}}" class="button">Open Dashboard</a>
                </div>
                
                <p style="text-align: center; font-size: 14px; color: #6b7280;">
                  "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort."<br>
                  <em>- Paul J. Meyer</em>
                </p>
              </div>
              <div class="footer">
                <p>This email was sent by OmniMind. <a href="{{settingsUrl}}">Adjust your email preferences</a></p>
                <p>© 2024 OmniMind. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      passwordReset: {
        subject: 'Reset Your OmniMind Password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; color: white; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 25px; background: #fef2f2; border-radius: 0 0 10px 10px; }
              .code { display: inline-block; padding: 15px 25px; background: white; border: 2px dashed #ef4444; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .footer { text-align: center; margin-top: 25px; color: #6b7280; font-size: 14px; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🔐 Password Reset Request</h2>
              </div>
              <div class="content">
                <h3>Hello,</h3>
                <p>We received a request to reset your OmniMind password. If you didn't make this request, you can safely ignore this email.</p>
                
                <div style="text-align: center; margin: 25px 0;">
                  <div class="code">{{resetCode}}</div>
                  <p style="font-size: 14px; color: #6b7280;">This code will expire in 1 hour</p>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Never share this code with anyone</li>
                    <li>OmniMind will never ask for your password</li>
                    <li>This code is for one-time use only</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="{{resetUrl}}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 14px;">
                  {{resetUrl}}
                </p>
                
                <p>If you need further assistance, please contact our support team.</p>
                
                <p>Best regards,<br>The OmniMind Security Team</p>
              </div>
              <div class="footer">
                <p>This email was sent to {{email}}.</p>
                <p>© 2024 OmniMind. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
    };
  }

  async sendEmail(to, templateName, variables) {
    try {
      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Replace variables in template
      let subject = template.subject;
      let html = template.html;

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        html = html.replace(regex, value);
      }

      const mailOptions = {
        from: `"OmniMind" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail(user.email, 'welcome', {
      name: user.name,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      helpUrl: `${process.env.FRONTEND_URL}/help`,
      unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`,
      privacyUrl: `${process.env.FRONTEND_URL}/privacy`,
    });
  }

  async sendTaskReminder(user, task, project = null) {
    const dueDate = new Date(task.due_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.sendEmail(user.email, 'taskReminder', {
      name: user.name,
      taskTitle: task.title,
      taskDescription: task.description || '',
      taskPriority: task.priority,
      dueDate,
      projectName: project?.name || '',
      taskUrl: `${process.env.FRONTEND_URL}/tasks/${task.id}`,
      settingsUrl: `${process.env.FRONTEND_URL}/settings/notifications`,
    });
  }

  async sendDailyDigest(user, data) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return this.sendEmail(user.email, 'dailyDigest', {
      name: user.name,
      date: dateStr,
      dayName: today.toLocaleDateString('en-US', { weekday: 'long' }),
      taskStats: {
        total: data.totalTasks || 0,
        completed: data.completedTasks || 0,
        overdue: data.overdueTasks || 0,
        dueToday: data.dueToday || 0,
      },
      priorities: data.priorities || [],
      meetings: data.meetings || [],
      suggestions: data.suggestions || [],
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      settingsUrl: `${process.env.FRONTEND_URL}/settings/notifications`,
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail(user.email, 'passwordReset', {
      resetCode: resetToken.substring(0, 8).toUpperCase(),
      resetUrl,
      email: user.email,
    });
  }

  async sendCustomNotification(email, subject, content) {
    try {
      const mailOptions = {
        from: `"OmniMind" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 25px; background: #f9fafb; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 25px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>📢 OmniMind Notification</h2>
              </div>
              <div class="content">
                ${content}
                <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                  <p style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL}/dashboard" style="color: #3b82f6; text-decoration: none;">Go to Dashboard</a> | 
                    <a href="${process.env.FRONTEND_URL}/settings/notifications" style="color: #3b82f6; text-decoration: none;">Notification Settings</a>
                  </p>
                </div>
              </div>
              <div class="footer">
                <p>© 2024 OmniMind. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Custom notification sent to ${email}: ${info.messageId}`);
      
      return info;
    } catch (error) {
      logger.error('Error sending custom notification:', error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();