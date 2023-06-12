const ShortURL = require('../model/shortUrlModal');
const path = require('path');
const fs = require('fs');

const generateShortURL = async (req, res) => {
  const { longURL } = req.body;

  try {
    // Create a new ShortURL document
    const newShortURL = new ShortURL({
      longURL,
    });

    // Save the document to the database
    await newShortURL.save();
    const shortURLs = await ShortURL.find({});

    // Create the table rows from the database URLs
    const tbodyContent = shortURLs
      .map((url) => {
        return `
          <tr>
            <td>${url.longURL}</td>
            <td>${url.shortURL}</td>
            <td>${url.visits}</td>
            <td>
              <button class="generate-qr-button">Generate QR Code</button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Read the HTML file
    const homePage = path.join(__dirname, '..', 'public', 'html', 'Home.html');

    fs.readFile(homePage, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        res.status(500).send('Internal Server Error');
        return;
      }

      // Modify the table body content within the HTML
      const modifiedData = data.replace(
        '<tbody id="shortURLTableBody">',
        `<tbody id="shortURLTableBody">${tbodyContent}`
      );

      // Write the modified HTML to the original file
      fs.writeFile(homePage, modifiedData, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          res.status(500).send('Internal Server Error');
          return;
        }

        // Send the modified HTML file as the response
        res.sendFile(homePage);
      });
    });
  } catch (error) {
    console.error('Error generating short URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating short URL',
    });
  }
};

module.exports = { generateShortURL };
