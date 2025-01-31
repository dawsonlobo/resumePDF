import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import mjml2html from 'mjml';
import generateResume from './resumeGenerator';
import readline from 'readline';
import { CONFIG } from './config';

import fetch, { Headers } from 'node-fetch';

// Explicitly define the types for globalThis
(globalThis as any).fetch = fetch;
(globalThis as any).Headers = Headers;





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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter the filename of the JSON file: ', async (filename) => {
    try {
        const filePath = path.join(__dirname, '..', filename); // Adjust path to root directory
        if (!fs.existsSync(filePath)) {
            throw new Error('JSON file not found');
        }

        const resumeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Validate the JSON data
        if (!resumeData.personal || !resumeData.contact || !resumeData.education || !resumeData.skills || !resumeData.experience || !resumeData.projects || !resumeData.certificates || !resumeData.achievements || !resumeData.icons) {
            throw new Error('Missing required resume data');
        }

        const epochTime = Date.now();
        const pdfFileName = `resume_${epochTime}.pdf`;
        const pdfFilePath = path.join(PDF_OUTPUT_DIR, pdfFileName);

        if (!fs.existsSync(PDF_OUTPUT_DIR)) {
            fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
        }

        // Generate resume with the provided data
        await generateResume(resumeData);

        // Wait a brief moment to ensure file writing is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify the file exists and is readable before proceeding
        if (!fs.existsSync('Resume.pdf')) {
            throw new Error('Resume.pdf was not generated');
        }

        // Rename the generated file
        fs.renameSync('Resume.pdf', pdfFilePath);

        // Verify the renamed file exists
        if (!fs.existsSync(pdfFilePath)) {
            throw new Error('Failed to move generated PDF to target location');
        }

        // Read file as a Buffer directly
        const fileBuffer = fs.readFileSync(pdfFilePath);
        
        // Verify file size
        if (fileBuffer.length === 0) {
            throw new Error('Generated PDF is empty');
        }

        const emailHtml = generateEmailHTML('');

        // Send email using the Buffer directly without base64 conversion
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'gayathri3332003@gmail.com', // Use your own email address for testing
            subject: 'Your Generated Resume',
            html: emailHtml,
            attachments: [{
                filename: pdfFileName,
                content: fileBuffer.toString('base64'),  // Convert Buffer to base64
                contentType: 'application/pdf'
            }]
        });

        if (response.error) {
            throw new Error(`Email sending failed: ${response.error.message}`);
        }

        console.log('Resume generated and email sent successfully');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        rl.close();
    }
});