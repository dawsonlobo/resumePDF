// this is resumegenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const resumeData = require('./resumeData');

const path = require('path');

function validateImage(imagePath) {
    if (!imagePath) return false;
    try {
        return fs.existsSync(imagePath);
    } catch (error) {
        return false;
    }
}

function validateIconPaths(icons) {
    const validIcons = { ...icons };
    for (const [key, iconPath] of Object.entries(icons)) {
        if (!validateImage(iconPath)) {
            validIcons[key] = ''; // Set empty if invalid path
        }
    }
    return validIcons;
}

function updateResumeData(newData) {
    function mergeData(target, source) {
        for (let key in source) {
            if (source[key] === null || source[key] === undefined) continue;

            if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                mergeData(target[key], source[key]);
            } else if (Array.isArray(source[key])) {
                if (source[key].length > 0) {
                    target[key] = [...source[key]];
                }
            } else {
                target[key] = source[key];
            }
        }
    }
    
    // Deep clone the current data to avoid mutations
    const updatedData = JSON.parse(JSON.stringify(resumeData));
    mergeData(updatedData, newData);
    return updatedData;
}

function generateResume(reqBody) {
    return new Promise((resolve, reject) => {
        try {
            // Update data with request body
            const mergedData = updateResumeData(reqBody);
            
            // Validate image paths
            mergedData.icons = validateIconPaths(mergedData.icons);
            const hasValidProfileImage = validateImage(mergedData.profileImage?.path);

            // Create PDF document
            const doc = new PDFDocument({ 
                margin: mergedData.documentSettings.margin,
                autoFirstPage: true,
                size: 'A4'
            });

            // Setup file writing
            const outputPath = path.resolve('Resume.pdf');
            const writeStream = fs.createWriteStream(outputPath);
            
            // Handle stream errors
            writeStream.on('error', (error) => {
                reject(new Error(`Failed to write PDF: ${error.message}`));
            });

            // Handle successful completion
            writeStream.on('finish', () => {
                resolve(outputPath);
            });

            // Pipe document to write stream
            doc.pipe(writeStream);

            // Draw background rectangle
            doc.save();
            doc.rect(
                mergedData.documentSettings.sideBoxSettings.x,
                mergedData.documentSettings.sideBoxSettings.y,
                mergedData.documentSettings.sideBoxSettings.width,
                mergedData.documentSettings.sideBoxSettings.height
            )
            .fillColor(mergedData.documentSettings.sideBoxSettings.color)
            .fill();
            doc.restore();

            // Add profile image if valid
            if (hasValidProfileImage) {
                drawProfileImage(doc, mergedData);
            }

            // Add sections
            addPersonalInfo(doc, mergedData);
            addContactInfo(doc, mergedData);
            addEducation(doc, mergedData);
            addSkills(doc, mergedData);
            addExperience(doc, mergedData);
            addProjects(doc, mergedData);
            addCertificates(doc, mergedData);
            addAchievements(doc, mergedData);

            // Finalize the PDF
            doc.end();

        } catch (error) {
            reject(new Error(`Failed to generate resume: ${error.message}`));
        }
    });
}

function drawProfileImage(doc, data) {
    const img = resumeData.profileImage;
    
    doc.save();
    doc.moveTo(img.x + img.horizontalRadius, img.y);
    doc.ellipse(
        img.x + img.horizontalRadius,
        img.y + img.verticalRadius,
        img.horizontalRadius,
        img.verticalRadius
    );
    doc.clip();

    doc.image(
        img.path,
        img.x - 10,
        img.y - 5,
        {
            width: img.width + 0,
            height: img.height + 0,
            cover: [img.width - 100, img.height - 25],
        }
    );
    doc.restore();

    // Draw oval border
    doc.lineWidth(img.borderThickness);
    doc.strokeColor('white');
    doc.ellipse(
        img.x + img.horizontalRadius,
        img.y + img.verticalRadius,
        img.horizontalRadius,
        img.verticalRadius
    ).stroke();
    doc.lineWidth(1);
}

function addPersonalInfo(doc, data) {
    // Name
    doc.font(resumeData.styling.primaryFont)
       .fontSize(32)
       .text(data.personal.name, 245, 40);

    // Profile
    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.sectionHeadingFontSize)
       .text('PROFILE', 245, 95);
    doc.moveTo(245, doc.y + 5)
       .lineTo(580, doc.y + 5)
       .stroke('#000000');
    doc.moveDown(0.8);
    doc.font(resumeData.styling.secondaryFont)
       .fontSize(resumeData.styling.normalFontSize)
       .text(data.personal.profile, 245, doc.y, {
           width: 340
       });
}

function addContactInfo(doc, data) {
    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.sectionHeadingFontSize)
       .text('CONTACT', 50, 180);
    doc.moveTo(50, doc.y + 5)
       .lineTo(210, doc.y + 5)
       .stroke('#000000');
    doc.moveDown(0.8);

    const contact = resumeData.contact;
    doc.font(resumeData.styling.secondaryFont)
       .fontSize(resumeData.styling.normalFontSize);

    // Address
    doc.image(resumeData.icons.location, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.address.line1, 70, doc.y);
    doc.text(data.contact.address.line2, 70, doc.y);

    // Phone
    doc.image(resumeData.icons.phone, 50, doc.y + 1, { width: 10, height: 10 });
    doc.text(data.contact.phone, 70, doc.y);

    // Email
    doc.image(resumeData.icons.email, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.email, 70, doc.y, { width: 150 });

    // LinkedIn
    doc.image(resumeData.icons.linkedin, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.linkedin, 70, doc.y, { width: 150 });

    // GitHub
    doc.image(resumeData.icons.github, 50, doc.y + 1, { width: 12, height: 12 });
    doc.text(data.contact.github, 70, doc.y);
}

function addEducation(doc, data) {
   // Fixed starting position
   const startY = 325;
   
   doc.font(resumeData.styling.primaryFont)
      .fontSize(resumeData.styling.sectionHeadingFontSize)
      .text('EDUCATION', 50, startY);
   
   doc.moveTo(50, doc.y + 5)
      .lineTo(210, doc.y + 5)
      .stroke('#000000');

   let currentY = doc.y + 15; // Consistent spacing after heading

   // Iterate through each education entry in the provided data
   data.education.forEach(newEdu => {
       // Check and update fields if provided in the data, otherwise fallback to resumeData
       const degree = newEdu.degree || resumeData.education[0].degree; // Use first entry as fallback
       const institution = newEdu.institution || resumeData.education[0].institution;
       const year = newEdu.year || resumeData.education[0].year;
       const score = newEdu.score || resumeData.education[0].score;

       // Add degree, institution, and year to the document
       doc.font('Helvetica-Bold')
          .fontSize(resumeData.styling.normalFontSize)
          .text(degree, 50, currentY, { width: 180 });
       
       currentY = doc.y + 0; // Consistent spacing between lines

       doc.font('Helvetica')
          .fontSize(resumeData.styling.normalFontSize)
          .text(institution, 50, currentY, { width: 180 });
       
       currentY = doc.y + 0;
       
       doc.text(`${year}, ${score}`, 50, currentY, { width: 180 });
       currentY = doc.y + 10; // Larger gap between education entries
   });
}


function addSkills(doc, data) {
    // Fixed starting position
    const startY = 540;
    
    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.sectionHeadingFontSize)
       .text('SKILLS', 50, startY);

    doc.moveTo(50, doc.y + 5)
       .lineTo(210, doc.y + 5)
       .stroke('#000000');

    let currentY = doc.y + 15;

    // Languages section
    doc.font('Helvetica-Bold')
       .fontSize(resumeData.styling.normalFontSize)
       .text('Languages:', 50, currentY);
    
    currentY = doc.y + 2 ;
    
    data.skills.languages.forEach(lang => {
        doc.font(resumeData.styling.secondaryFont)
           .fontSize(resumeData.styling.normalFontSize)
           .text(`• ${lang}`, 60, currentY,{width: 180});
        currentY = doc.y + 1.5;
    });

    currentY = doc.y + 3;

    // Technical section
    doc.font('Helvetica-Bold')
       .fontSize(resumeData.styling.normalFontSize)
       .text('Technical:', 50, currentY);
    
    currentY = doc.y + 2;
    
    data.skills.technical.forEach(skill => {
        doc.font(resumeData.styling.secondaryFont)
           .fontSize(resumeData.styling.normalFontSize)
           .text(`• ${skill}`, 60, currentY,{width: 180});
        currentY = doc.y + 1.5;
    });
}

function addExperience(doc, data) {
    const startY = 210;
    
    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.sectionHeadingFontSize)
       .text('EXPERIENCE', 245, startY);

    doc.moveTo(245, doc.y + 5)
       .lineTo(580, doc.y + 5)
       .stroke('#000000');

    let currentY = doc.y + 15;
    const exp = data.experience;

    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.normalFontSize)
       .text(exp.title, 245, currentY);
    
    currentY = doc.y + 1;
    
    doc.font(resumeData.styling.secondaryFont)
       .text(exp.duration, 245, currentY)
       .text(exp.location)
       .text(exp.supervisor);
    
    currentY = doc.y + 5;

    exp.responsibilities.forEach(resp => {
        doc.text(`• ${resp}`, 255, currentY, { width: 315 });
        currentY = doc.y + 5;
    });
}

function addProjects(doc, data) {
    const startY = 375;
    
    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.sectionHeadingFontSize)
       .text('TECHNICAL PROJECTS', 245, startY);

    doc.moveTo(245, doc.y + 5)
       .lineTo(580, doc.y + 5)
       .stroke('#000000');

    let currentY = doc.y + 15;

    data.projects.forEach(project => {
        doc.font(resumeData.styling.primaryFont)
           .fontSize(resumeData.styling.normalFontSize)
           .text(project.name, 245, currentY);
        
        currentY = doc.y + 2;
        
        doc.font(resumeData.styling.secondaryFont)
           .text(project.description, 245, currentY, { width: 340 });
        
        currentY = doc.y + 6;
    });
}

function addCertificates(doc, data) {
    const startY = 585;
    
    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.sectionHeadingFontSize)
       .text('CERTIFICATES', 245, startY);

    doc.moveTo(245, doc.y + 5)
       .lineTo(580, doc.y + 5)
       .stroke('#000000');

    let currentY = doc.y + 15;

    data.certificates.forEach(cert => {
        doc.font(resumeData.styling.secondaryFont)
           .fontSize(resumeData.styling.normalFontSize)
           .text(`• ${cert}`, 245, currentY, { width: 340 });
        currentY = doc.y + 4;
    });
}

function addAchievements(doc, data) {
    const startY = 680;
    
    doc.font(resumeData.styling.primaryFont)
       .fontSize(resumeData.styling.sectionHeadingFontSize)
       .text('ACHIEVEMENTS', 245, startY);

    doc.moveTo(245, doc.y + 5)
       .lineTo(580, doc.y + 5)
       .stroke('#000000');

    let currentY = doc.y + 15;

    data.achievements.forEach(achievement => {
        doc.font(resumeData.styling.secondaryFont)
           .fontSize(resumeData.styling.normalFontSize)
           .text(`• ${achievement}`, 245, currentY, { width: 340 });
        currentY = doc.y + 5;
    });
}

module.exports = generateResume;