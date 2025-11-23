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

      // REQUIREMENT #6: Always include Head of IT email for HoIT-related notifications
      const hoitNotificationTypes = ['LM_APPROVED', 'QA_VALIDATED', 'HOIT_APPROVED'];
      if (hoitNotificationTypes.includes(notificationType)) {
        const hoitEmail = 'hoit@eazy.bh';
        if (!emailAddresses.includes(hoitEmail)) {
          emailAddresses.push(hoitEmail);
        }
      }

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
   * Send CR notification email to specific email addresses (not by user ID)
   */
  async sendCRNotificationByEmail(
    cr: ChangeRequest,
    notificationType: string,
    emailAddresses: string[],
  ): Promise<void> {
    console.log('📧 sendCRNotificationByEmail called:', {
      crNumber: cr.crNumber,
      type: notificationType,
      emails: emailAddresses,
    });

    try {
      if (emailAddresses.length === 0) {
        console.log('⚠️ No email addresses provided');
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
      // Don't throw - notification failure shouldn't block workflow
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
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .email-wrapper {
          padding: 40px 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .header h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .content { 
          background-color: #ffffff; 
          padding: 30px;
        }
        .info-box { 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px; 
          margin: 20px 0; 
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }
        .info-row {
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
        }
        .info-label {
          font-weight: 600;
          color: #4a5568;
        }
        .info-value {
          color: #2d3748;
          font-weight: 500;
        }
        .button { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important; 
          padding: 14px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          display: inline-block; 
          margin-top: 20px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .priority-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        .priority-high { background-color: #ff4d4f; color: white; }
        .priority-medium { background-color: #faad14; color: white; }
        .priority-low { background-color: #52c41a; color: white; }
        .priority-critical { background-color: #ff4d4f; color: white; animation: pulse 2s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .footer { 
          text-align: center; 
          padding: 20px;
          font-size: 12px; 
          color: #8c8c8c;
          background-color: #f5f5f5;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e0e0e0, transparent);
          margin: 20px 0;
        }
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
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>🆕 New Change Request Created</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748; margin-bottom: 20px;">
                  A new change request has been submitted and <strong>requires your UAT approval</strong>.
                </p>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">CR Number:</span>
                    <span class="info-value">${cr.crNumber}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="info-row">
                    <span class="info-label">Requested By:</span>
                    <span class="info-value">${requesterName}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="info-row">
                    <span class="info-label">Priority:</span>
                    <span class="priority-badge priority-${cr.businessPriority.toLowerCase()}">${cr.businessPriority}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="info-row">
                    <span class="info-label">Current Stage:</span>
                    <span class="info-value">Pending Line Manager Approval</span>
                  </div>
                  <div class="divider"></div>
                  <div style="margin-top: 15px;">
                    <div class="info-label" style="margin-bottom: 8px;">Purpose:</div>
                    <div class="info-value">${cr.purposeOfChange}</div>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${crUrl}" class="button">📋 View & Approve Change Request</a>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated notification from Change Management System</p>
                <p style="margin-top: 10px; color: #bfbfbf;">Please do not reply to this email</p>
              </div>
            </div>
          </div>
        `,
      },

      LM_APPROVED: {
        subject: `[Action Required] CR ${cr.crNumber} - Line Manager Approved`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>✅ Line Manager Approval Received</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748; margin-bottom: 20px;">
                  The Line Manager has approved this change request. <strong>Please review and assign an IT Officer.</strong>
                </p>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">CR Number:</span>
                    <span class="info-value">${cr.crNumber}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="info-row">
                    <span class="info-label">Priority:</span>
                    <span class="priority-badge priority-${cr.businessPriority.toLowerCase()}">${cr.businessPriority}</span>
                  </div>
                  <div class="divider"></div>
                  <div style="margin-top: 15px;">
                    <div class="info-label" style="margin-bottom: 8px;">Purpose:</div>
                    <div class="info-value">${cr.purposeOfChange}</div>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${crUrl}" class="button">🔍 Review & Assign IT Officer</a>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated notification from Change Management System</p>
                <p style="margin-top: 10px; color: #bfbfbf;">Please do not reply to this email</p>
              </div>
            </div>
          </div>
        `,
      },

      HOIT_APPROVED: {
        subject: `[Action Required] CR ${cr.crNumber} - Assigned to You`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>📋 Change Request Assigned to You</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748; margin-bottom: 20px;">
                  This change request has been <strong>assigned to you</strong> for technical assessment and implementation.
                </p>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">CR Number:</span>
                    <span class="info-value">${cr.crNumber}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="info-row">
                    <span class="info-label">Priority:</span>
                    <span class="priority-badge priority-${cr.businessPriority.toLowerCase()}">${cr.businessPriority}</span>
                  </div>
                  <div class="divider"></div>
                  <div style="margin-top: 15px;">
                    <div class="info-label" style="margin-bottom: 8px;">Purpose:</div>
                    <div class="info-value">${cr.purposeOfChange}</div>
                  </div>
                  <div class="divider"></div>
                  <div style="margin-top: 15px;">
                    <div class="info-label" style="margin-bottom: 8px;">Description:</div>
                    <div class="info-value">${cr.descriptionOfChange}</div>
                  </div>
                </div>
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                  <strong style="color: #e65100;">Required Actions:</strong>
                  <ul style="margin: 10px 0 0 20px; color: #5d4037;">
                    <li>Complete technical impact assessment</li>
                    <li>Fill in category and subcategory</li>
                    <li>Perform UAT testing and document results</li>
                    <li>Prepare deployment team information</li>
                  </ul>
                </div>
                <div style="text-align: center;">
                  <a href="${crUrl}" class="button">🚀 Start Assessment</a>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated notification from Change Management System</p>
                <p style="margin-top: 10px; color: #bfbfbf;">Please do not reply to this email</p>
              </div>
            </div>
          </div>
        `,
      },

      ITO_SUBMITTED: {
        subject: `[Action Required] CR ${cr.crNumber} - Test Results Ready`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>🧪 Test Results Ready for Review</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">The IT Officer has completed testing. <strong>Please review and confirm the results.</strong></p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">📊 Review Test Results</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      REQUESTOR_CONFIRMED: {
        subject: `CR ${cr.crNumber} - Ready for QA Validation`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>✅ Ready for QA Validation</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">Requestor has confirmed test results. <strong>Please validate UAT results and complete QA checklist.</strong></p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">📋 Start QA Validation</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      QA_VALIDATED: {
        subject: `CR ${cr.crNumber} - QA Validation Complete`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>✅ QA Validation Complete</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">QA validation is complete. <strong>Ready for production approval.</strong></p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">🚀 Approve for Production</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      HOIT_PRODUCTION_APPROVED: {
        subject: `[Action Required] CR ${cr.crNumber} - Security Approval Required`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>🔒 Final Security Approval Required</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">Please provide <strong>final security approval</strong> for this change request.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">🛡️ Review Security</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      HOIS_APPROVED: {
        subject: `[Ready to Deploy] CR ${cr.crNumber}`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #52c41a 0%, #237804 100%);">
                <h2>✅ Ready to Deploy</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">All approvals granted. <strong>Please proceed with deployment.</strong></p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">🚀 Proceed to Deploy</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      DEPLOYMENT_COMPLETED: {
        subject: `CR ${cr.crNumber} - Deployment Completed`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);">
                <h2>🎉 Deployment Completed</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">Deployment completed successfully. <strong>Awaiting 48-hour monitoring and NOC closure.</strong></p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">👀 Monitor Progress</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      CR_CLOSED: {
        subject: `[Completed] CR ${cr.crNumber}`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #52c41a 0%, #237804 100%);">
                <h2>✅ Change Request Completed</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">This change request has been successfully completed and closed.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">📄 View Final Report</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      CR_REJECTED: {
        subject: `[Rejected] CR ${cr.crNumber}`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);">
                <h2>❌ Change Request Rejected</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">This change request has been rejected. Please review the approval history for details.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${crUrl}" class="button">📋 View Details</a>
                </div>
              </div>
              <div class="footer">
                <p>Change Management System</p>
              </div>
            </div>
          </div>
        `,
      },

      DEPLOYMENT_TEAM_ADDED: {
        subject: `You've been added to CR ${cr.crNumber} Deployment Team`,
        body: `
          ${commonStyles}
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h2>👥 Added to Deployment Team</h2>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #2d3748;">
                  You have been added as a member of the deployment team for this change request.
                </p>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">CR Number:</span>
                    <span class="info-value">${cr.crNumber}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="info-row">
                    <span class="info-label">Priority:</span>
                    <span class="priority-badge priority-${cr.businessPriority.toLowerCase()}">${cr.businessPriority}</span>
                  </div>
                  <div class="divider"></div>
                  <div style="margin-top: 15px;">
                    <div class="info-label" style="margin-bottom: 8px;">Purpose:</div>
                    <div class="info-value">${cr.purposeOfChange}</div>
                  </div>
                </div>
                <div style="background-color: #e6f7ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1890ff;">
                  <strong style="color: #0050b3;">Team Member Responsibilities:</strong>
                  <ul style="margin: 10px 0 0 20px; color: #1d39c4;">
                    <li>Coordinate with IT Officer for deployment activities</li>
                    <li>Participate in deployment planning and execution</li>
                    <li>Provide technical support during deployment</li>
                    <li>Report any issues or concerns immediately</li>
                  </ul>
                </div>
                <div style="text-align: center;">
                  <a href="${crUrl}" class="button">👀 View Change Request</a>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated notification from Change Management System</p>
                <p style="margin-top: 10px; color: #bfbfbf;">Please do not reply to this email</p>
              </div>
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
