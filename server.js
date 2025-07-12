const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/output', express.static(path.join(__dirname, '../output')));

app.post('/convert', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No file uploaded.');
  }

  const file = req.files.file;
  const ext = path.extname(file.name).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png'];
  if (!allowed.includes(ext)) {
    return res.status(400).send('Only JPG or PNG files allowed.');
  }

  const id = uuidv4();
  const inputPath = path.join(__dirname, '../output', `${id}${ext}`);
  const outputPath = path.join(__dirname, '../output', `${id}.pdf`);

  await file.mv(inputPath);

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  doc.image(inputPath, {
    fit: [500, 700],
    align: 'center',
    valign: 'center'
  });
  doc.end();

  stream.on('finish', () => {
    fs.unlinkSync(inputPath);
    res.json({ link: `/output/${id}.pdf` });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));