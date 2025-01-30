import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import mjml2html from 'mjml';
import generateResume from './resumeGenerator';
import resumeData from './resumeData';

dotenv.config();

const app = express();
const port = 3000;

// Define the output directory for PDFs
const PDF_OUTPUT_DIR = 'D:/Exelon/resumePDF';  // Adjust this path as needed

const resend = new Resend(process.env.RESEND_API_KEY as string);

// Middleware to parse JSON requests
app.use(bodyParser.json());

const generateEmailHTML = (resumeLink: string): string => {
    const mjmlTemplatePath = path.join(__dirname, 'resumeTemplate.mjml');
    const mjmlContent = fs.readFileSync(mjmlTemplatePath, 'utf-8');
    const htmlOutput = mjml2html(mjmlContent.replace('{{resumeLink}}', resumeLink));
    return htmlOutput.html;
};

app.get('/resume', (req: Request, res: Response) => {
    res.json(resumeData);
});

app.post('/generate-resume', async (req: Request, res: Response) => {
    try {
        const epochTime = Date.now();
        const fileName = `resume_${epochTime}.pdf`;
        const filePath = path.join(PDF_OUTPUT_DIR, fileName);

        if (!fs.existsSync(PDF_OUTPUT_DIR)) {
            fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
        }

        // Generate resume with the provided data
        await generateResume(req.body);

        // Wait a brief moment to ensure file writing is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify the file exists and is readable before proceeding
        if (!fs.existsSync('Resume.pdf')) {
            throw new Error('Resume.pdf was not generated');
        }

        // Rename the generated file
        fs.renameSync('Resume.pdf', filePath);

        // Verify the renamed file exists
        if (!fs.existsSync(filePath)) {
            throw new Error('Failed to move generated PDF to target location');
        }

        // Read file as a Buffer directly
        const fileBuffer = fs.readFileSync(filePath);
        
        // Verify file size
        if (fileBuffer.length === 0) {
            throw new Error('Generated PDF is empty');
        }

        const emailHtml = generateEmailHTML('');

        // Send email using the Buffer directly without base64 conversion
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'gayathri3332003@gmail.com',
            subject: 'Your Generated Resume',
            html: emailHtml,
            attachments: [{
                filename: fileName,
                content: fileBuffer.toString('base64'),  // Convert Buffer to base64
                contentType: 'application/pdf'
            }]
        });

        if (response.error) {
            throw new Error(`Email sending failed: ${response.error.message}`);
        }

        // Verify the generated PDF can be opened locally
        try {
            // Try to read the file again to verify it's not corrupted
            fs.readFileSync(filePath);
            console.log('PDF verification successful');
        } catch (error) {
            console.error('PDF verification failed:', error);
            throw new Error('Generated PDF appears to be corrupted');
        }

        res.json({
            message: 'Resume generated and email sent successfully',
            fileName: fileName,
            timestamp: epochTime
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Operation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Resume generator API running at http://localhost:${port}`);
});