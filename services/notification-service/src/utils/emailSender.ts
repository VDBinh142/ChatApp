/**
 * Mock email sender
 * In production, replace with actual email service (SendGrid, AWS SES, etc.)
 */

interface EmailData {
  senderId: string;
  receiverId: string;
  content?: string;
  type?: string;
}

export async function sendEmailNotification(emailData: EmailData): Promise<{ success: boolean }> {
  try {
    console.log(`[Email Sender] Sending email from ${emailData.senderId} to ${emailData.receiverId}`);
    console.log(`[Email Sender] Content:`, emailData.content);

    // TODO: Integrate with actual email service
    // Example integration:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: 'noreply@chat.app',
    //   to: recipientEmail,
    //   subject: 'Friend Request',
    //   html: `<p>${emailData.content}</p>`
    // });

    return { success: true };
  } catch (error) {
    console.error('[Email Sender] Failed to send email:', error);
    throw error;
  }
}
