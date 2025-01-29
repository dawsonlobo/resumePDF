const express = require('express');
const bodyParser = require('body-parser');
const generateResume = require('./resumeGenerator');
const path = require('path');
const fs = require('fs');
let resumeData = require('./resumeData');
const { Resend } = require('resend');
const mjml2html = require('mjml'); 
require('dotenv').config();

const app = express();
const port = 3000;

// Define the output directory for PDFs
const PDF_OUTPUT_DIR = 'D:/Exelon/resumePDF';  // Adjust this path as needed

const resend = new Resend(process.env.RESEND_API_KEY);
// Middleware to parse JSON requests

const generateEmailHTML = (resumeLink) => {
    const mjmlTemplatePath = path.join(__dirname, 'resumeTemplate.mjml');
    const mjmlContent = fs.readFileSync(mjmlTemplatePath, 'utf-8');
    const htmlOutput = mjml2html(mjmlContent.replace('{{resumeLink}}', resumeLink));
    return htmlOutput.html;
};

app.use(bodyParser.json());

app.get('/resume', (req, res) => {
    res.json(resumeData);
});

app.post('/generate-resume', async (req, res) => {
    try {
        // Generate timestamp for unique filename
        const epochTime = Date.now();
        const fileName = `resume_${epochTime}.pdf`;
        const filePath = path.join(PDF_OUTPUT_DIR, fileName);

        // Ensure output directory exists
        if (!fs.existsSync(PDF_OUTPUT_DIR)) {
            fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
        }

        // Generate resume with the provided data
        await generateResume(req.body);

        // Rename the generated file from Resume.pdf to our timestamped name
        fs.renameSync('Resume.pdf', filePath);

        // Create file path URL format
        const filePathUrl = `file:///${filePath.replace(/\\/g, '/')}`;

        const fileData = fs.readFileSync(filePath);
        const fileBase64 = fileData.toString('base64');
        
        const emailHtml = generateEmailHTML(filePathUrl);

        // Send email with the generated PDF to a fixed recipient
        resend.emails.send({
            from: 'onboarding@resend.dev', // Use your verified sender email
            to: 'gayathri3332003@gmail.com',
            subject: 'Your Generated Resume',
            html: emailHtml,
            attachments: [
                {
                    filename: fileName,
                    content: fileBase64,
                    contentType: 'application/pdf'
                }
            ]
        });

        // Send response with file path
        res.json({
            message: 'Resume generated successfully',
            filePath: filePathUrl,
            fileName: fileName,
            timestamp: epochTime
        });

    } catch (error) {
        console.error('Error generating resume:', error);
        res.status(500).json({ error: 'Error generating resume' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Resume generator API running at http://localhost:${port}`);
});

// const PDFDocument = require('pdfkit');
// const fs = require('fs');

// // Details stored in a single object
// const resumeData = {
//    documentSettings: { margin: 50 },
//    colors: { background: '#f1ebea', line: '#000000' },
//    fonts: {
//        primary: 'Helvetica-Bold',
//        secondary: 'Helvetica',
//        sectionHeadingSize: 16,
//        normalFontSize: 11.5,
//    },
//    personalDetails: {
//        name: 'Gayathri',
//        contact: {
//            address: ['Sri Geetha Priya Nilaya', 'Hiriadka-576113'],
//            phone: '+91 8618260270',
//            email: 'gayathri333@gmail.com',
//            linkedin: 'www.linkedin.com/in/gayathri3213',
//            github: 'github.com/Gayathri3',
//        },
//    },
//    education: [
//        { degree: 'Bachelor of Engineering', institute: 'NMAM Institute of Technology', duration: '2021 - 2025', cgpa: '8.61' },
//        { degree: 'Pre-University Course', institute: 'Mahatma Gandhi Memorial College, Udupi', duration: '2019 - 2021', percentage: '88.67' },
//        { degree: 'SSLC', institute: 'G.P.U High School', duration: '2016 - 2019', percentage: '92.33' },
//    ],
//    skills: {
//        languages: ['C/C++', 'HTML/CSS/JavaScript', 'Python'],
//        technical: [
//            'Internet of Things',
//            'Data Structure and Algorithms',
//            'DBMS',
//            'Operating System',
//            'Computer Networks',
//            'Cyber Security',
//        ],
//    },
//    experience: [
//        {
//            title: 'Cyber Security Tools for Ethical Hacking',
//            duration: 'February 03, 2023 - March 15, 2023',
//            location: 'MIT Manipal, Manipal',
//            supervisor: 'Dr. Krishna Prakash',
//            points: [
//                'Gained hands-on experience with cybersecurity tools and ethical hacking practices.',
//                'Worked on securing systems and identifying vulnerabilities under expert supervision.',
//            ],
//        },
//    ],
//    projects: [
//        {
//            title: 'Social Media Project (Sociofly) using DBMS',
//            description:
//                'Developed a web-based application simulating a social media platform. Features post sharing, friend connections, and social interactions.',
//        },
//        {
//            title: 'Smart Speed Breaker using IoT',
//            description:
//                'Designed a system to enhance road safety at zebra crossings. Utilized ultrasonic sensors to detect vehicles or pedestrians.',
//        },
//        {
//            title: 'Shopnest: E-commerce Application',
//            description:
//                'Created a responsive e-commerce app for browsing, purchasing, and profile management using Android Studio, Java, XML, and Firebase.',
//        },
//    ],
//    certificates: [
//        'Successfully completed the Data Science course at Adverk.',
//        'Successfully completed Foundations of Cybersecurity course.',
//        'Successfully completed AWS Cloud Practitioner Essentials.',
//    ],
//    achievements: ['Received the patent for IoT project "Smart Speed Breaker"'],
// };


// // Create a document
// const doc = new PDFDocument({ margin: 50 });

// // Save the PDF to a file
// doc.pipe(fs.createWriteStream('Resume.pdf'));

// doc.save(); // Save the current graphics state
// doc.rect(30, 30, 200, 730) // Position (x, y), width, and height of the box
//    .fillColor('#f1ebea') // Brown color (Hex code for brown)
//    .fill();
// doc.restore(); // Restore the graphics state for text colors
// // Fonts and Colors
// const primaryFont = 'Helvetica-Bold';
// const secondaryFont = 'Helvetica';
// const sectionHeadingFontSize = 16;
// const normalFontSize = 11.5;

// // Define image position and dimensions
// const imageX = 70;
// const imageY = 60;
// const horizontalRadius = 55;  // Horizontal radius
// const verticalRadius = 53;    // Vertical radius
// const borderThickness = 4;    // Border thickness
// const imageWidth = horizontalRadius * 2;  // Total image width
// const imageHeight = verticalRadius * 2.5; // Increased height to cover vertical space

// // Create an oval clipping path for profile image
// doc.save();
// doc.moveTo(imageX + horizontalRadius, imageY);
// doc.ellipse(imageX + horizontalRadius, imageY + verticalRadius, horizontalRadius, verticalRadius);
// doc.clip();

// // Draw the image with cover option to fill the space completely
// doc.image('C:\\Users\\HP\\OneDrive\\Desktop\\Interview essential\\Gayathri_photo.jpeg', 
//     imageX - 10,  // Shifted left slightly
//     imageY - 5,   // Shifted up slightly
//     {
//         width: imageWidth + 0,  // Increased width
//         height: imageHeight + 0, // Increased height
//         cover: [imageWidth -100, imageHeight -25], // Using cover instead of fit
//     }
// );
// doc.restore();

// // Draw oval border with thickness
// doc.lineWidth(borderThickness);
// doc.ellipse(imageX + horizontalRadius, imageY + verticalRadius, horizontalRadius, verticalRadius).stroke();
// doc.lineWidth(1); // Reset line width to default
// // Name
// doc.font(primaryFont).fontSize(32).text('Gayathri', 245, 40);

// // Profile Section
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('PROFILE', 245, 95);
// doc.moveTo(245, doc.y + 5).lineTo(580, doc.y + 5).stroke('#000000');
// doc.moveDown(0.8);
// doc.font(secondaryFont).fontSize(normalFontSize)
//    .text('As a final-year engineering student, I am passionate about applying my problem-solving skills to develop innovative solutions that benefit society. My academic journey has provided me with a solid foundation in engineering principles, along with practical experience in various technologies.', 245, doc.y, {
//        width: 340
//    });

// // Contact Information (Left Side)
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('CONTACT', 50, 180);
// doc.moveTo(50, doc.y + 5).lineTo(210, doc.y + 5).stroke('#000000');
// doc.moveDown(0.8);
// doc.font(secondaryFont).fontSize(normalFontSize)
//    doc.image('D:/Exelon/resumePDF/emojis/loc.png', 50, doc.y + 1, { width: 12, height: 12 }); // House emoji
//    doc.text('Sri Geetha Priya Nilaya', 70, doc.y);

//    //doc.image('D:/Exelon/resumePDF/emojis/house.png', 50, doc.y + 10, { width: 12, height: 12 }); // House emoji
//    doc.text('Hiriadka-576113', 70, doc.y);
   
//    doc.image('D:/Exelon/resumePDF/emojis/phone-call.png', 50, doc.y + 1, { width: 10, height: 10 }); // Phone emoji
//    doc.text('+91 8618260270', 70, doc.y);
   
//    doc.image('D:/Exelon/resumePDF/emojis/email.png', 50, doc.y + 1, { width: 12, height: 12 }); // Email emoji
//    doc.text('gayathri333@gmail.com', 70, doc.y,{width: 150});
   
//    doc.image('D:/Exelon/resumePDF/emojis/linkedin.png', 50, doc.y + 1, { width: 12, height: 12 }); // LinkedIn emoji
//    doc.text('www.linkedin.com/in/gayathri3213', 70, doc.y,{width: 150});
   
//    doc.image('D:/Exelon/resumePDF/emojis/github.png', 50, doc.y + 1, { width: 12, height: 12 }); // GitHub emoji
//    doc.text('github.com/Gayathri3', 70, doc.y);

// // Education Section (Left Side)
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('EDUCATION', 50, 320); // EDUCATION in bold

// doc.font(secondaryFont).fontSize(normalFontSize);
// doc.moveTo(50, doc.y + 5).lineTo(210, doc.y + 5).stroke('#000000');
// // Bachelor of Engineering - Bold
// doc.moveDown(0.2)
// doc.font('Helvetica-Bold').text('Bachelor of Engineering', 50, doc.y + 10);
// // Normal text for institute and details
// doc.font('Helvetica').text('NMAM Institute of Technology',{width: 150})
//    .text('2021 - 2025, CGPA: 8.61')
//    .moveDown(0.5);

// // Pre-University Course - Bold
// doc.font('Helvetica-Bold').text('Pre-University Course');
// // Normal text for institute and details
// doc.font('Helvetica').text('Mahatma Gandhi Memorial College, Udupi',{width: 150})
//    .text('2019 - 2021, Percentage: 88.67')
//    .moveDown(0.5);

// // SSLC - Bold
// doc.font('Helvetica-Bold').text('SSLC (Secondary School Leaving Certificate)',{width: 150});
// // Normal text for institute and details
// doc.font('Helvetica').text('G.P.U High School')
//    .text('2016 - 2019, Percentage: 92.33');


// // Skills Section (Left Side)
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('SKILLS', 50, 540);
// doc.font(secondaryFont).fontSize(normalFontSize);

// doc.moveTo(50, doc.y + 5).lineTo(210, doc.y + 5).stroke('#000000'); 
// // Languages Section
// doc.moveDown(0.2)
// doc.font('Helvetica-Bold').text('Languages:', 50, doc.y + 10);
// doc.moveDown(0.1)
// doc.font(secondaryFont).list(
//     [
//         'C/C++',
//         'HTML/CSS/JavaScript',
//         'Python'
//     ],
//     { indent: 10, width: 150 }
// );

// // Move down slightly
// doc.moveDown(0.5);
// doc.font('Helvetica-Bold').text('Technical:', { indent: 0 });
// doc.moveDown(0.1);
// doc.font(secondaryFont).list(
//        [
//            'Internet of Things',
//            'Data Structure and Algorithms',
//            'DBMS',
//            'Operating System',
//            'Computer Networks',
//            'Cyber Security'
//        ],
//        { indent: 10, width: 150 }
//    );
   

// // Experience Section (Right Side)
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('EXPERIENCE', 245, 210);
// doc.font(secondaryFont).fontSize(normalFontSize)
// doc.moveTo(245, doc.y + 5).lineTo(580, doc.y + 5).stroke('#000000')
// doc.moveDown(0.3)
//    .text('Project: Cyber Security Tools for Ethical Hacking', 245, doc.y + 10)
//    .text('Duration: February 03, 2023 - March 15, 2023')
//    .text('Location: MIT Manipal, Manipal')
//    .text('Supervisor: Dr. Krishna Prakash')
//    .moveDown(0.5)
//    .text('• Gained hands-on experience with cybersecurity tools and ethical hacking practices.', { indent: 10 })
//    .text('• Worked on securing systems and identifying vulnerabilities under expert supervision.', { indent: 10 });

// // Technical Projects Section (Right Side)
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('TECHNICAL PROJECTS', 245, 370);
// doc.font(secondaryFont).fontSize(normalFontSize)
// doc.moveTo(245, doc.y + 5).lineTo(580, doc.y + 5).stroke('#000000');
// doc.moveDown(0.3);
// doc.font(primaryFont).text('Social Media Project (Sociofly) using DBMS', 245, doc.y + 10)
// doc.font(secondaryFont).text('Developed a web-based application simulating a social media platform. Features post sharing, friend connections, and social interactions.', { width: 340 })
//    .moveDown(0.5)
// doc.font(primaryFont).text('Smart Speed Breaker using IoT')
// doc.font(secondaryFont).text('Designed a system to enhance road safety at zebra crossings. Utilized ultrasonic sensors to detect vehicles or pedestrians.', { width: 340 })
//    .moveDown(0.5)
// doc.font(primaryFont).text('Shopnest: E-commerce Application')
// doc.font(secondaryFont).text('Created a responsive e-commerce app for browsing, purchasing, and profile management using Android Studio, Java, XML, and Firebase.', { width: 340 });

// // Certificates Section (Right Side)
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('CERTIFICATES', 245, 580);
// doc.font(secondaryFont).fontSize(normalFontSize)
// doc.moveTo(245, doc.y + 5).lineTo(580, doc.y + 5).stroke('#000000')
// doc.moveDown(0.3)
//    .text('• Successfully completed the Data Science course at Adverk.', 245, doc.y + 10, { width: 340 })
//    .moveDown(0.3)
//    .text('• Successfully completed Foundations of Cybersecurity course.', { width: 340 })
//    .moveDown(0.3)
//    .text('• Successfully completed AWS Cloud Practitioner Essentials.', { width: 340 });

// // Achievements Section (Right Side)
// doc.font(primaryFont).fontSize(sectionHeadingFontSize).text('ACHIEVEMENTS', 245, 680);
// doc.font(secondaryFont).fontSize(normalFontSize)
// doc.moveTo(245, doc.y + 5).lineTo(580, doc.y + 5).stroke('#000000')
// doc.moveDown(0.3)
//    .text('• Received the patent for IOT project "Smart Speed Breaker"', 245, doc.y + 10, { width: 340 });

// // End the document
// doc.end();