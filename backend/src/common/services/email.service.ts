import { Injectable } from '@nestjs/common';
import { ChangeRequest } from '../../modules/change-management/entities/change-request.entity';

// You'll need to install and configure your preferred email service
// Options: @nestjs-modules/mailer, nodemailer, SendGrid, AWS SES, etc.

interface EmailTemplate {
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  // Configure your email transport here
  // private transporter: any;

  constructor() {
    // Initialize your email service
    // Example with nodemailer:
    // this.transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
  }

  async sendCRNotification(
    cr: ChangeRequest,
    notificationType: string,
    recipientUserIds: number[],
  ): Promise<void> {
    const template = this.getEmailTemplate(cr, notificationType);

    // Get recipient emails from user IDs
    // In a real implementation, you would query the User table
    // const recipients = await this.userRepository.findByIds(recipientUserIds);

    // For now, log the notification
    console.log(`[EMAIL] Notification Type: ${notificationType}`);
    console.log(`[EMAIL] CR Number: ${cr.crNumber}`);
    console.log(`[EMAIL] Subject: ${template.subject}`);
    console.log(`[EMAIL] Recipients: ${recipientUserIds.join(', ')}`);
    console.log(`[EMAIL] Body: ${template.body}`);

    // Actual email sending implementation:
    // for (const recipient of recipients) {
    //   await this.transporter.sendMail({
    //     from: process.env.EMAIL_FROM,
    //     to: recipient.email,
    //     subject: template.subject,
    //     html: template.body,
    //   });
    // }
  }

  private getEmailTemplate(cr: ChangeRequest, notificationType: string): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const crLink = `${baseUrl}/change-requests/${cr.id}`;

    const templates: Record<string, EmailTemplate> = {
      CR_CREATED: {
        subject: `[Action Required] New Change Request ${cr.crNumber} - Pending Your Approval`,
        body: `
          <h2>New Change Request Submitted</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Purpose:</strong> ${cr.purposeOfChange}</p>
          <p><strong>Priority:</strong> ${cr.businessPriority}</p>
          <p><strong>Requested By:</strong> ${cr.requester?.firstName} ${cr.requester?.lastName}</p>
          <p>This change request requires your approval for UAT testing.</p>
          <p><a href="${crLink}">Click here to review and approve</a></p>
        `,
      },
      LM_APPROVED: {
        subject: `[Action Required] CR ${cr.crNumber} - UAT Approved by Line Manager`,
        body: `
          <h2>Line Manager Approval Received</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Status:</strong> Pending Head of IT Approval</p>
          <p>The Line Manager has approved this CR for UAT testing. Please review and assign to an IT Officer.</p>
          <p><a href="${crLink}">Click here to review</a></p>
        `,
      },
      HOIT_APPROVED: {
        subject: `[Action Required] CR ${cr.crNumber} - Assigned to You for Technical Assessment`,
        body: `
          <h2>Change Request Assignment</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Purpose:</strong> ${cr.purposeOfChange}</p>
          <p><strong>Priority:</strong> ${cr.businessPriority}</p>
          <p>You have been assigned as the IT Officer for this change request. Please complete the technical assessment including impact analysis, testing, and deployment planning.</p>
          <p><a href="${crLink}">Click here to start assessment</a></p>
        `,
      },
      ITO_SUBMITTED: {
        subject: `[Action Required] CR ${cr.crNumber} - Test Results Ready for Your Confirmation`,
        body: `
          <h2>Test Results Confirmation Required</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p>The IT Officer has completed testing for your change request. Please review and confirm the test results.</p>
          <p><a href="${crLink}">Click here to confirm test results</a></p>
        `,
      },
      REQUESTOR_CONFIRMED: {
        subject: `[Action Required] CR ${cr.crNumber} - Ready for QA Validation`,
        body: `
          <h2>QA Validation Required</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p>The requestor has confirmed the test results. Please validate the UAT results and complete the QA checklist.</p>
          <p><a href="${crLink}">Click here to validate</a></p>
        `,
      },
      QA_VALIDATED: {
        subject: `[Action Required] CR ${cr.crNumber} - Ready for Production Approval`,
        body: `
          <h2>Production Approval Required</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Priority:</strong> ${cr.businessPriority}</p>
          <p>QA validation has been completed. Please review and approve for production deployment.</p>
          <p><a href="${crLink}">Click here to approve</a></p>
        `,
      },
      HOIT_PRODUCTION_APPROVED: {
        subject: `[Action Required] CR ${cr.crNumber} - Final Security Approval Required`,
        body: `
          <h2>Final Security Approval Required</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Category:</strong> ${cr.category} / ${cr.subcategory}</p>
          <p><strong>Impacts Client Service:</strong> ${cr.impactsClientService ? 'YES' : 'NO'}</p>
          <p>Production approval has been granted by Head of IT. Please provide final security approval.</p>
          <p><a href="${crLink}">Click here to approve</a></p>
        `,
      },
      HOIS_APPROVED: {
        subject: `[Ready to Deploy] CR ${cr.crNumber} - Final Approval Granted`,
        body: `
          <h2>Final Approval Granted - Ready to Deploy</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Planned Deployment:</strong> ${cr.plannedDatetime}</p>
          <p>All approvals have been received. You may proceed with production deployment as planned.</p>
          <p><a href="${crLink}">Click here for deployment details</a></p>
        `,
      },
      DEPLOYMENT_COMPLETED: {
        subject: `[Information] CR ${cr.crNumber} - Deployment Completed`,
        body: `
          <h2>Deployment Completed</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Status:</strong> Waiting for Closure</p>
          <p>The deployment has been completed. NOC will monitor for 48 hours before closing the CR.</p>
          <p><a href="${crLink}">Click here to view details</a></p>
        `,
      },
      CR_REJECTED: {
        subject: `[Rejected] CR ${cr.crNumber} - Change Request Rejected`,
        body: `
          <h2>Change Request Rejected</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Status:</strong> Rejected</p>
          <p>Your change request has been rejected. Please review the rejection reason in the approval history.</p>
          <p><a href="${crLink}">Click here to view details</a></p>
        `,
      },
      CR_CLOSED: {
        subject: `[Completed] CR ${cr.crNumber} - Change Request Closed`,
        body: `
          <h2>Change Request Completed</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Status:</strong> Completed</p>
          <p>This change request has been successfully completed and closed by NOC.</p>
          ${cr.incidentTriggered ? '<p><strong>Note:</strong> Incident was triggered during monitoring period.</p>' : ''}
          ${cr.rollbackTriggered ? '<p><strong>Note:</strong> Rollback was triggered during monitoring period.</p>' : ''}
          <p><a href="${crLink}">Click here to view final details</a></p>
        `,
      },
    };

    return (
      templates[notificationType] || {
        subject: `[CR Update] ${cr.crNumber} - Status Changed`,
        body: `
          <h2>Change Request Update</h2>
          <p><strong>CR Number:</strong> ${cr.crNumber}</p>
          <p><strong>Current Status:</strong> ${cr.currentStatus}</p>
          <p><a href="${crLink}">Click here to view details</a></p>
        `,
      }
    );
  }

  // Additional helper methods for sending specific emails
  async sendReminder(cr: ChangeRequest, recipientUserIds: number[]): Promise<void> {
    console.log(`[EMAIL] Sending reminder for CR ${cr.crNumber}`);
    // Implement reminder logic
  }

  async sendEscalation(cr: ChangeRequest, managerUserIds: number[]): Promise<void> {
    console.log(`[EMAIL] Sending escalation for CR ${cr.crNumber}`);
    // Implement escalation logic
  }

  async sendDailyDigest(userId: number, pendingCRs: ChangeRequest[]): Promise<void> {
    console.log(`[EMAIL] Sending daily digest to user ${userId}`);
    // Implement daily digest logic
  }
}
