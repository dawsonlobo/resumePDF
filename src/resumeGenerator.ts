// this is resumeGenerator.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import resumeData from './resumeData';

const defaultSettings = {
    documentSettings: {
        margin: 50,
        sideBoxSettings: {
            x: 30,
            y: 30,
            width: 200,
            height: 730,
            color: '#E1E1E1'
        }
    },
    styling: {
        primaryFont: 'Helvetica-Bold',
        secondaryFont: 'Helvetica',
        sectionHeadingFontSize: 16,
        normalFontSize: 11.5
    },
    profileImage: {
        path: path.join(__dirname, 'C:\\Users\\HP\\OneDrive\\Desktop\\Interview essential\\Gayathri_photo.jpeg'), // Make sure this file exists
        x: 70,
        y: 60,
        horizontalRadius: 55,
        verticalRadius: 53,
        borderThickness: 4,
        width: 110,
        height: 132.5
    },
    icons: {
        location: path.join(__dirname, 'icons', 'location.png'),
        phone: path.join(__dirname, 'icons', 'phone.png'),
        email: path.join(__dirname, 'icons', 'email.png'),
        linkedin: path.join(__dirname, 'icons', 'linkedin.png'),
        github: path.join(__dirname, 'icons', 'github.png')
    }
};

interface DocumentSettings {
    margin: number;
    sideBoxSettings: {
        x: number;
        y: number;
        width: number;
        height: number;
        color: string;
    };
}

interface ProfileImage {
    path: string;
    x: number;
    y: number;
    width: number;
    height: number;
    horizontalRadius: number;
    verticalRadius: number;
    borderThickness: number;
}

interface Address {
    line1: string;
    line2: string;
}

interface Contact {
    address: Address;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
}

interface Education {
    degree: string;
    institution: string;
    period: string;
    score: string;
}

interface Skills {
    languages: string[];
    technical: string[];
}

interface Experience {
    title: string;
    duration: string;
    location: string;
    supervisor: string;
    responsibilities: string[];
}

interface Project {
    name: string;
    description: string;
}

interface Icons {
    [key: string]: string;
}

interface Styling {
    primaryFont: string;
    secondaryFont: string;
    sectionHeadingFontSize: number;
    normalFontSize: number;
}

interface ResumeData {
    documentSettings: DocumentSettings;
    profileImage: ProfileImage;
    personal: {
        name: string;
        profile: string;
    };
    contact: Contact;
    education: Education[];
    skills: Skills;
    experience: Experience;
    projects: Project[];
    certificates: string[];
    achievements: string[];
    icons: Icons;
    styling: Styling;
}

function validateImage(imagePath: string | undefined): boolean {
    if (!imagePath) return false;
    try {
        fs.accessSync(imagePath, fs.constants.R_OK);
        return true;
    } catch (error) {
        console.error(`Image not found or not accessible: ${imagePath}`);
        return false;
    }
}

function validateIconPaths(icons: Icons): Icons {
    const validIcons: Icons = { ...icons };
    for (const [key, iconPath] of Object.entries(icons)) {
        if (!validateImage(iconPath)) {
            delete validIcons[key];
        }
    }
    return validIcons;
}

function updateResumeData(newData: Partial<ResumeData>): ResumeData {
    function mergeData(target: any, source: any): void {
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                mergeData(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    const updatedData: ResumeData = JSON.parse(JSON.stringify(resumeData));
    mergeData(updatedData, newData);
    return updatedData;
}

function generateResume(reqBody: Partial<ResumeData>): Promise<string> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: reqBody.documentSettings?.margin || defaultSettings.documentSettings.margin });
        const filePath = 'Resume.pdf';
        doc.pipe(fs.createWriteStream(filePath));

        const data = updateResumeData(reqBody);

        drawProfileImage(doc, data);
        addPersonalInfo(doc, data);
        addContactInfo(doc, data);
        addEducation(doc, data);
        addSkills(doc, data);
        addExperience(doc, data);
        addProjects(doc, data);
        addCertificates(doc, data);
        addAchievements(doc, data);

        doc.end();
        resolve(filePath);
    });
}

function drawProfileImage(doc: PDFKit.PDFDocument, data: ResumeData): void {
    const { path, x, y, horizontalRadius, verticalRadius, borderThickness, width, height } = data.profileImage;
    if (validateImage(path)) {
        doc.save();
        doc.moveTo(x + horizontalRadius, y);
        doc.ellipse(x + horizontalRadius, y + verticalRadius, horizontalRadius, verticalRadius);
        doc.clip();
        doc.image(path, x - 10, y - 5, { width: width + 0, height: height + 0, cover: [width - 100, height - 25] });
        doc.restore();
        doc.lineWidth(borderThickness);
        doc.ellipse(x + horizontalRadius, y + verticalRadius, horizontalRadius, verticalRadius).stroke();
        doc.lineWidth(1);
    }
}

function addPersonalInfo(doc: PDFKit.PDFDocument, data: ResumeData): void {
    doc.font(data.styling.primaryFont)
        .fontSize(32)
        .text(data.personal.name, 245, 40);

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('PROFILE', 245, 95);
    doc.moveTo(245, doc.y + 5)
        .lineTo(580, doc.y + 5)
        .stroke('#000000');
    doc.moveDown(0.8);
    doc.font(data.styling.secondaryFont)
        .fontSize(data.styling.normalFontSize)
        .text(data.personal.profile, 245, doc.y, { width: 340 });
}

function addContactInfo(doc: PDFKit.PDFDocument, data: ResumeData): void {
    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('CONTACT', 50, 180);
    doc.moveTo(50, doc.y + 5)
        .lineTo(210, doc.y + 5)
        .stroke('#000000');
    doc.moveDown(0.6);

    doc.font(data.styling.secondaryFont)
        .fontSize(data.styling.normalFontSize);

    doc.image(data.icons.location, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.address.line1, 70, doc.y);
    doc.text(data.contact.address.line2, 70, doc.y);

    doc.image(data.icons.phone, 50, doc.y + 1, { width: 10, height: 10 });
    doc.text(data.contact.phone, 70, doc.y);

    doc.image(data.icons.email, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.email, 70, doc.y, { width: 150 });

    doc.image(data.icons.linkedin, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.linkedin, 70, doc.y, { width: 150 });

    doc.image(data.icons.github, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.github, 70, doc.y);
}

function addEducation(doc: PDFKit.PDFDocument, data: ResumeData): void {
    const startY = 315;

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('EDUCATION', 50, startY);

    doc.moveTo(50, doc.y + 5)
        .lineTo(210, doc.y + 5)
        .stroke('#000000');

    let currentY = doc.y + 10;

    data.education.forEach(newEdu => {
        doc.font(data.styling.primaryFont)
            .fontSize(data.styling.normalFontSize)
            .text(newEdu.degree, 50, currentY,{width: 180});

        currentY = doc.y + 1;

        doc.font(data.styling.secondaryFont)
            .text(newEdu.institution, 50, currentY,{width: 180})
            .text(newEdu.period)
            .text(newEdu.score);

        currentY = doc.y + 5;
    });
}

function addSkills(doc: PDFKit.PDFDocument, data: ResumeData): void {
    const startY = 535;

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('SKILLS', 50, startY);

    doc.moveTo(50, doc.y + 5)
        .lineTo(210, doc.y + 5)
        .stroke('#000000');

    let currentY = doc.y + 10;

    doc.font('Helvetica-Bold')
        .fontSize(data.styling.normalFontSize)
        .text('Languages:', 50, currentY);

    currentY = doc.y + 2;

    data.skills.languages.forEach(lang => {
        doc.font('Helvetica')
            .fontSize(data.styling.normalFontSize)
            .text(lang, 50, currentY);
        currentY = doc.y + 2;
    });

    currentY = doc.y + 3;

    doc.font('Helvetica-Bold')
        .fontSize(data.styling.normalFontSize)
        .text('Technical:', 50, currentY);

    currentY = doc.y + 2;

    data.skills.technical.forEach(skill => {
        doc.font('Helvetica')
            .fontSize(data.styling.normalFontSize)
            .text(skill, 50, currentY);
        currentY = doc.y + 2;
    });
}

function addExperience(doc: PDFKit.PDFDocument, data: ResumeData): void {
    const startY = 210;

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('EXPERIENCE', 245, startY);

    doc.moveTo(245, doc.y + 5)
        .lineTo(580, doc.y + 5)
        .stroke('#000000');

    let currentY = doc.y + 15;
    const exp = data.experience;

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.normalFontSize)
        .text(exp.title, 245, currentY);

    currentY = doc.y + 1;

    doc.font(data.styling.secondaryFont)
        .text(exp.duration, 245, currentY)
        .text(exp.location)
        .text(exp.supervisor);

    currentY = doc.y + 5;

    exp.responsibilities.forEach(resp => {
        doc.font(data.styling.secondaryFont)
            .fontSize(data.styling.normalFontSize)
            .text(`- ${resp}`, 245, currentY);
        currentY = doc.y + 2;
    });
}

function addProjects(doc: PDFKit.PDFDocument, data: ResumeData): void {
    const startY = 375;

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('TECHNICAL PROJECTS', 245, startY);

    doc.moveTo(245, doc.y + 5)
        .lineTo(580, doc.y + 5)
        .stroke('#000000');

    let currentY = doc.y + 15;

    data.projects.forEach(project => {
        doc.font(data.styling.primaryFont)
            .fontSize(data.styling.normalFontSize)
            .text(project.name, 245, currentY);

        currentY = doc.y + 1;

        doc.font(data.styling.secondaryFont)
            .text(project.description, 245, currentY, { width: 340 });

        currentY = doc.y + 5;
    });
}

function addCertificates(doc: PDFKit.PDFDocument, data: ResumeData): void {
    const startY = 575;

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('CERTIFICATES', 245, startY);

    doc.moveTo(245, doc.y + 5)
        .lineTo(580, doc.y + 5)
        .stroke('#000000');

    let currentY = doc.y + 15;

    data.certificates.forEach(cert => {
        doc.font(data.styling.secondaryFont)
            .fontSize(data.styling.normalFontSize)
            .text(`- ${cert}`, 245, currentY);
        currentY = doc.y + 2;
    });
}

function addAchievements(doc: PDFKit.PDFDocument, data: ResumeData): void {
    const startY = 675;

    doc.font(data.styling.primaryFont)
        .fontSize(data.styling.sectionHeadingFontSize)
        .text('ACHIEVEMENTS', 245, startY);
    doc.moveTo(245, doc.y + 5)
        .lineTo(580, doc.y + 5)
        .stroke('#000000');

    let currentY = doc.y + 15;

    data.achievements.forEach(ach => {
        doc.font(data.styling.secondaryFont)
            .fontSize(data.styling.normalFontSize)
            .text(`- ${ach}`, 245, currentY);
        currentY = doc.y + 2;
    });
}

export default generateResume;