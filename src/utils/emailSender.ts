import nodemailer from "nodemailer";
import { prisma } from "../services/prisma";
import { logger } from "./logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in environment variables"
    );
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendFriendRequestEmail(
  senderUsername: string,
  receiverUsername: string
): Promise<void> {
  const receiver = await prisma.user.findUnique({
    where: { username: receiverUsername },
    select: { email: true },
  });

  if (!receiver?.email) {
    logger.info(
      `Skipping friend request email - ${receiverUsername} has no email on file`
    );
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER!,
    to: receiver.email,
    subject: "New friend request",
    text: `${senderUsername} sent you a friend request. Log in to accept or decline.`,
  };

  await getTransporter().sendMail(mailOptions);
  logger.info(`Friend request email sent to ${receiverUsername}`);
}
