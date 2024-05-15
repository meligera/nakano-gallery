const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');

// Use cors before all route definitions
app.use(cors());

// Serve images statically from each character's folder
const characters = ['Ichika', 'Nino', 'Miku', 'Yotsuba', 'Itsuki', 'Together'];

characters.forEach((character) => {
  app.use(
    `/images/${character}`,
    express.static(path.join(__dirname, `/images/${character}`))
  );
});

// List images endpoint for each character
app.get('/images/:character/list', (req, res) => {
  const character = req.params.character;

  // Ensure that the character is one of the valid options to prevent unauthorized access
  if (!characters.includes(character)) {
    res.status(404).send('Character not found');
    return;
  }

  const imagesDirectory = path.join(__dirname, `/images/${character}`);

  fs.readdir(imagesDirectory, (err, files) => {
    if (err) {
      console.error(`Could not list the directory for ${character}.`, err);
      res.status(500).send('Internal server error');
      return;
    }

    const fileUrls = files.map((file) => `/images/${character}/${file}`);
    res.json(fileUrls);
  });
});

// Thumbnail images endpoint for each character
app.get('/images/:character/thumbnail/:imageName', async (req, res) => {
  const character = req.params.character;
  const imageName = req.params.imageName;

  // Ensure that the character is one of the valid options to prevent unauthorized access
  if (!characters.includes(character)) {
    res.status(404).send('Character not found');
    return;
  }

  const imagePath = path.join(__dirname, `/images/${character}/${imageName}`);

  try {
    const image = await sharp(imagePath);

    // Get the original image dimensions
    const { width, height } = await image.metadata();

    // Calculate the new dimensions (6 times smaller)
    const newWidth = Math.floor(width / 6);
    const newHeight = Math.floor(height / 6);

    // Resize the image
    const buffer = await image
     .resize(newWidth, newHeight)
     .toBuffer();

    res.type('jpg');
    res.send(buffer);
  } catch (err) {
    console.error(`Could not generate thumbnail for ${imagePath}.`, err);
    res.status(500).send('Internal server error');
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
