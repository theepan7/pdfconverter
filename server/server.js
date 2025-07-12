const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ✅ Serve static frontend and output files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/output', express.static(outputDir));

// ✅ Enable file uploads
app.use(fileUpload());

// ✅ Main route: Convert uploaded image to PDF
app.post('/convert', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send('No file uploaded.');
    }

    const file = req.files.file;
    const ext = path.extname(file.name).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png'];

    if (!allowed.includes(ext)) {
      return res.status(400).send('Only JPG and PNG files are allowed.');
    }

    const id = uuidv4();
    const inputPath = path.join(outputDir, `${id}${ext}`);
    const outputPath = path.join(outputDir, `${id}.pdf`);

    // Save uploaded image
    await file.mv(inputPath);

    // Create PDF and embed image
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);
    doc.image(inputPath, {
      fit: [500, 700],
      align: 'center',
      valign: 'center',
    });
    doc.end();

    stream.on('finish', () => {
      fs.unlinkSync(inputPath); // optional: delete uploaded image
      res.json({ link: `/output/${id}.pdf` });
    });

    stream.on('error', (err) => {
      console.error('PDF stream error:', err);
      res.status(500).send('PDF creation failed.');
    });

  } catch (err) {
    console.error('Unhandled error:', err);
    res.status(500).send('Server error during conversion.');
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
