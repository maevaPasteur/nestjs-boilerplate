import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  async sendSlackAlert(message: string, data?: any) {

    // Intégration Slack
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${message}`,
          attachments: data ? [{
            color: 'danger',
            fields: Object.entries(data).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true,
            })),
          }] : [],
        }),
      });
    } catch (error) {
      this.logger.error('Failed to send Slack alert:', error);
    }
  }

  async sendEmail(subject: string, body: string) {
    // Intégration email (SendGrid, AWS SES, etc.)
  }
}