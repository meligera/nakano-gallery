const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');

// Use cors before all route definitions
app.use(cors());

// Serve images statically from each character's folder
const characters = ['Ichika', 'Nino', 'Miku', 'Yotsuba', 'Itsuki', 'Together'];
characters.forEach((character) => {
  app.use(`/images/${character}`, express.static(path.join(__dirname, `/images/${character}`)));
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

    const fileUrls = files.map(file => `/images/${character}/${file}`);
    res.json(fileUrls);
  });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
