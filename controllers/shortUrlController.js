// const ShortURL = require('../model/shortUrlModal');
// const path = require('path');
// const fs = require('fs');
// const os = require('os');

// const generateShortURLAndUpdateHomepage = async (req, res) => {
//   const { longURL } = req.body;

//   try {
//     // Create a new ShortURL document
//     const newShortURL = new ShortURL({
//       longURL,
//     });

//     // Save the document to the database
//     await newShortURL.save();
//     const shortURLs = await ShortURL.find({});

//     // Create the table rows from the database URLs
//     const tbodyContent = shortURLs
//       .map((url) => {
//         return `
//           <tr>
//             <td>${url.longURL}</td>
//             <td>${url.shortURL}</td>
//             <td>${url.visits}</td>
//             <td>
//               <button class="generate-qr-button">Generate QR Code</button>
//             </td>
//           </tr>
//         `;
//       })
//       .join('');

//     // Read the HTML file
//     const homePage = path.join(__dirname, '..', 'public', 'html', 'Home.html');

//     fs.readFile(homePage, 'utf8', (err, data) => {
//       if (err) {
//         console.error('Error reading file:', err);
//         res.status(500).send('Internal Server Error');
//         return;
//       }

//       // Modify the table body content within the HTML
//       const modifiedData = data.replace(
//         '<tbody id="shortURLTableBody">',
//         `<tbody id="shortURLTableBody">${tbodyContent}`
//       );

//       // Create a temporary file path
//       const tempFilePath = path.join(os.tmpdir(), 'modifiedHomePage.html');

//       // Write the modified HTML to the temporary file
//       fs.writeFile(tempFilePath, modifiedData, 'utf8', (err) => {
//         if (err) {
//           console.error('Error writing file:', err);
//           res.status(500).send('Internal Server Error');
//           return;
//         }

//         // Send the temporary file as the response
//         res.sendFile(tempFilePath, (err) => {
//           if (err) {
//             console.error('Error sending file:', err);
//             res.status(500).send('Internal Server Error');
//           }

//           // Delete the temporary file after sending it
//           fs.unlink(tempFilePath, (err) => {
//             if (err) {
//               console.error('Error deleting file:', err);
//             }
//           });
//         });
//       });
//     });
//   } catch (error) {
//     console.error('Error generating short URL:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error generating short URL',
//     });
//   }
// };

// module.exports = { generateShortURLAndUpdateHomepage };
const ShortURL = require('../model/shortUrlModal');
const User = require('../model/userModel');
const path = require('path');
const fs = require('fs');
const os = require('os');

const generateShortURLAndUpdateHomepage = async (req, res) => {
  const { longURL } = req.body;

  try {
    // Create a new ShortURL document
    const newShortURL = new ShortURL({
      longURL,
    });

    // Save the document to the database
    await newShortURL.save();

    // Find the user who generated the ShortURL
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Associate the ShortURL with the user
    user.shortURLs.push(newShortURL);
    await user.save();

    // Retrieve the updated list of ShortURLs for the user
    const shortURLs = await ShortURL.find({ _id: { $in: user.shortURLs } });

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

      // Create a temporary file path
      const tempFilePath = path.join(os.tmpdir(), 'modifiedHomePage.html');

      // Write the modified HTML to the temporary file
      fs.writeFile(tempFilePath, modifiedData, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          res.status(500).send('Internal Server Error');
          return;
        }

        // Send the temporary file as the response
        res.sendFile(tempFilePath, (err) => {
          if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
          }

          // Delete the temporary file after sending it
          fs.unlink(tempFilePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            }
          });
        });
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

module.exports = { generateShortURLAndUpdateHomepage };
