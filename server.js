const express = require('express');
const path = require('path');
const fs = require('fs'); // Add this line
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
// Use it before all route definitions
app.use(cors());



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Serve images statically
app.use('/images', express.static(path.join(__dirname, '/images')));

// List images endpoint
app.get('/images/list', (req, res) => {
  const imagesDirectory = path.join(__dirname, '/images');

  fs.readdir(imagesDirectory, (err, files) => {
    if (err) {
      console.error("Could not list the directory.", err);
      res.status(500).send('Internal server error');
    }

    const fileUrls = files.map(file => `/images/${file}`);
    res.json(fileUrls);
  });
});

// Other express routes and listen function...
