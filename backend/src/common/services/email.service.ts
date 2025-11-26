import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ChangeRequest } from '../../modules/change-management/entities/change-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
// Adjust this import path based on your actual User entity location
// Common paths: '../../modules/auth/entities/user.entity' OR '../../auth/entities/user.entity'
// Check your actual file structure and update accordingly

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    // Comment out User repository for now if path is wrong
    // We'll fix it based on your structure
    // @InjectRepository(User)
    // private userRepository: Repository<User>,
  ) {
    // Initialize email transporter (FIXED: createTransport not createTransporter)
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
      // Add these for better debugging
      debug: true,
      logger: true,
    });

    console.log('📧 EmailService initialized with:', {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      user: this.configService.get('SMTP_USER'),
    });
  }

  /**
   * Send CR notification email to specified users
   */
  async sendCRNotification(
    cr: ChangeRequest,
    notificationType: string,
    recipientIds: number[],
  ): Promise<void> {
    console.log('📧 sendCRNotification called:', {
      crNumber: cr.crNumber,
      type: notificationType,
      recipientIds,
    });

    try {
      // TEMPORARY: Get emails from CR object relations instead of separate query
      // This works because your CR already has requester, lineManager, assignedITOfficer loaded
      const emailAddresses: string[] = [];

      // Map recipient IDs to emails from the CR relations
      recipientIds.forEach(id => {
        if (cr.requester && cr.requester.id === id && cr.requester.email) {
          emailAddresses.push(cr.requester.email);
        }
        if (cr.lineManager && cr.lineManager.id === id && cr.lineManager.email) {
          emailAddresses.push(cr.lineManager.email);
        }
        if (cr.assignedITOfficer && cr.assignedITOfficer.id === id && cr.assignedITOfficer.email) {
          emailAddresses.push(cr.assignedITOfficer.email);
        }
      });

      console.log('📧 Recipient emails:', emailAddresses);

      if (emailAddresses.length === 0) {
        console.log('⚠️ No valid email addresses found for recipients:', recipientIds);
        return;
      }

      // Get email template
      const { subject, body } = this.getEmailTemplate(cr, notificationType);

      // Send email
      const mailOptions = {
        from: this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER'),
        to: emailAddresses.join(', '),
        subject,
        html: body,
      };

      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Get email template based on notification type
   */
  private getEmailTemplate(
    cr: ChangeRequest,
    type: string,
  ): { subject: string; body: string } {
    const baseUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const crUrl = `${baseUrl}/change-requests/${cr.id}`;

    const commonStyles = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f5f5f5; padding: 20px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .button { background-color: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    `;

    const requesterName = cr.requester
      ? `${cr.requester.firstName} ${cr.requester.lastName}`
      : 'Unknown';

    const templates: Record<string, { subject: string; body: string }> = {
      CR_CREATED: {
        subject: `[Action Required] New Change Request ${cr.crNumber}`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>New Change Request Created</h2>
            </div>
            <div class="content">
              <div class="info-box">
                <p><strong>CR Number:</strong> ${cr.crNumber}</p>
                <p><strong>Purpose:</strong> ${cr.purposeOfChange}</p>
                <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(cr.businessPriority)}">${cr.businessPriority}</span></p>
                <p><strong>Requested By:</strong> ${requesterName}</p>
                <p><strong>Current Stage:</strong> Pending Line Manager Approval</p>
              </div>
              <p>A new change request has been submitted and requires your UAT approval.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Change Management System</p>
            </div>
          </div>
        `,
      },

      LM_APPROVED: {
        subject: `CR ${cr.crNumber} - Approved by Line Manager`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>Line Manager Approval Received</h2>
            </div>
            <div class="content">
              <div class="info-box">
                <p><strong>CR Number:</strong> ${cr.crNumber}</p>
                <p><strong>Purpose:</strong> ${cr.purposeOfChange}</p>
                <p><strong>Priority:</strong> ${cr.businessPriority}</p>
              </div>
              <p>The Line Manager has approved this change request. Please review and assign an IT Officer.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Change Management System</p>
            </div>
          </div>
        `,
      },

      HOIT_APPROVED: {
        subject: `CR ${cr.crNumber} - Assigned to You`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>Change Request Assigned</h2>
            </div>
            <div class="content">
              <div class="info-box">
                <p><strong>CR Number:</strong> ${cr.crNumber}</p>
                <p><strong>Purpose:</strong> ${cr.purposeOfChange}</p>
              </div>
              <p>This change request has been assigned to you for technical assessment.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Change Management System</p>
            </div>
          </div>
        `,
      },

      ITO_SUBMITTED: {
        subject: `CR ${cr.crNumber} - Test Results Ready`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>Test Results Ready</h2>
            </div>
            <div class="content">
              <p>The IT Officer has completed testing. Please review and confirm.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
          </div>
        `,
      },

      REQUESTOR_CONFIRMED: {
        subject: `CR ${cr.crNumber} - Ready for QA`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>Ready for QA Validation</h2>
            </div>
            <div class="content">
              <p>Please validate the UAT results and complete the QA checklist.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
          </div>
        `,
      },

      QA_VALIDATED: {
        subject: `CR ${cr.crNumber} - QA Complete`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>QA Validation Complete</h2>
            </div>
            <div class="content">
              <p>Ready for production approval.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
          </div>
        `,
      },

      HOIT_PRODUCTION_APPROVED: {
        subject: `CR ${cr.crNumber} - Security Approval Required`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>Final Security Approval Required</h2>
            </div>
            <div class="content">
              <p>Please provide final security approval.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
          </div>
        `,
      },

      HOIS_APPROVED: {
        subject: `[Ready to Deploy] CR ${cr.crNumber}`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header" style="background-color: #52c41a;">
              <h2>✅ Ready to Deploy</h2>
            </div>
            <div class="content">
              <p>All approvals granted. Please proceed with deployment.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
          </div>
        `,
      },

      DEPLOYMENT_COMPLETED: {
        subject: `CR ${cr.crNumber} - Deployment Completed`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header">
              <h2>Deployment Completed</h2>
            </div>
            <div class="content">
              <p>Deployment completed. Awaiting 48-hour monitoring and NOC closure.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
          </div>
        `,
      },

      CR_CLOSED: {
        subject: `[Completed] CR ${cr.crNumber}`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header" style="background-color: #52c41a;">
              <h2>✅ Change Request Completed</h2>
            </div>
            <div class="content">
              <p>This change request has been successfully completed and closed.</p>
              <p><a href="${crUrl}" class="button">View Change Request</a></p>
            </div>
          </div>
        `,
      },

      CR_REJECTED: {
        subject: `[Rejected] CR ${cr.crNumber}`,
        body: `
          ${commonStyles}
          <div class="container">
            <div class="header" style="background-color: #ff4d4f;">
              <h2>❌ Change Request Rejected</h2>
            </div>
            <div class="content">
              <p>This change request has been rejected. Please review the approval history.</p>
              <p><a href="${crUrl}" class="button">View Details</a></p>
            </div>
          </div>
        `,
      },
    };

    return templates[type] || {
      subject: `Change Request ${cr.crNumber} - Notification`,
      body: `
        ${commonStyles}
        <div class="container">
          <div class="header">
            <h2>Change Request Update</h2>
          </div>
          <div class="content">
            <p><strong>CR Number:</strong> ${cr.crNumber}</p>
            <p>There has been an update to this change request.</p>
            <p><a href="${crUrl}" class="button">View Change Request</a></p>
          </div>
        </div>
      `,
    };
  }

  /**
   * Get color for priority badge
   */
  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      Low: '#52c41a',
      Medium: '#faad14',
      High: '#ff4d4f',
      Critical: '#ff4d4f',
    };
    return colors[priority] || '#1890ff';
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}
