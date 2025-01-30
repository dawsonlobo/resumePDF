declare module 'resend' {
    export class Resend {
        constructor(apiKey: string);
        emails: {
            send(options: {
                from: string;
                to: string;
                subject: string;
                html: string;
                attachments?: Array<{
                    filename: string;
                    content: string;
                    contentType: string;
                }>;
            }): Promise<{ error?: { message: string } }>;
        };
    }
}
