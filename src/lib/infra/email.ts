export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log(
      `[email] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`,
    );
  }
}

let singleton: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (singleton) return singleton;
  const driver = process.env.EMAIL_DRIVER ?? "console";
  if (driver === "console") {
    singleton = new ConsoleEmailProvider();
  } else {
    singleton = new ConsoleEmailProvider();
  }
  return singleton;
}
