const ShortURL = require("../model/shortUrlModal");
const User = require("../model/userModel");
const path = require("path");
const fs = require("fs");
const os = require("os");

const qrcode = require("qrcode");


  const generateQRCode = (text, callback) => {
    console.log(text);
    if (!text) {
      const error = new Error("Invalid input: text is empty or null");
      callback(error);
      return;
    }
  
    // Generate QR code as an image file
    const filePath = `public/img/qrcode_${Date.now()}.png`; // File path to save the image
    qrcode.toFile(filePath, text, (error) => {
      if (error) {
        callback(error);
        return;
      }
  
      // Read the image file as binary data
      fs.readFile(filePath, (error, qrCodeData) => {
        
        if (error) {
          callback(error);
          return;
        }
  
        // Remove the temporary image file
        // fs.unlink(filePath, (error) => {
        //   if (error) {
        //     console.error("Error deleting temporary QR code image:", error);
        //   }
        // });
  
        // Convert the binary data to base64 string
        const qrCodeBase64 = qrCodeData.toString("base64");
        const qrCodeDataUrl = "data:image/png;base64," + qrCodeBase64;
  
        callback(null, qrCodeDataUrl);
      });
    });
  // console.log(text);
  // if (!text) {
  //   const error = new Error("Invalid input: text is empty or null");
  //   callback(error);
  //   return;
  // }

  // qrcode.toDataURL(text, (error, qrCodeDataUrl) => {
  //   if (error) {
  //     callback(error);
  //     return;
  //   }

  //   callback(null, qrCodeDataUrl);
  // });
};

// HTTP request handler
const generateQRCodeHandler = (req, res) => {
  const text = req.body.text; // Access the input text from the request body or query parameters

  generateQRCode(text, (error, qrCodeDataUrl) => {
    if (error) {
      console.error("Error generating QR code:", error);
      res.sendStatus(500); // Send an appropriate error response
      return;
    }

    // QR code generated successfully
    console.log("QR code generated:", qrCodeDataUrl);
    res.send(qrCodeDataUrl); // Send the QR code data URL as the response
  });
};
// Function to generate a new ShortURL document
const generateShortURL = async (longURL, customURL) => {
  // Check if the custom URL already exists in the database
  if (customURL) {
    const existingURL = await ShortURL.findOne({ customURL });
    if (existingURL) {
      throw new Error("Custom URL already exists");
    }
  }

  // Create a new ShortURL document1`
  const newShortURL = new ShortURL({
    longURL,
    customURL: customURL || undefined,
  });

  // Save the document to the database
  await newShortURL.save();

  return newShortURL;
};

// Function to associate a ShortURL with a user
const associateShortURLWithUser = async (userId, shortURL) => {
  // Find the user who generated the ShortURL
  const user = await User.findById(userId);

  // Associate the ShortURL with the user
  user.shortURLs.push(shortURL);
  await user.save();
};

// Function to retrieve the list of ShortURLs for a user
const getShortURLsForUser = async (userId) => {
  const user = await User.findById(userId);
  const shortURLs = await ShortURL.find({ _id: { $in: user.shortURLs } });
  return shortURLs;
};

// Function to modify the HTML file with updated table rows
const modifyHTMLFile = (htmlFilePath, tbodyContent) => {
  return new Promise((resolve, reject) => {
    fs.readFile(htmlFilePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      // Modify the table body content within the HTML
      const modifiedData = data.replace(
        '<tbody id="shortURLTableBody">',
        `<tbody id="shortURLTableBody">${tbodyContent}`
      );

      resolve(modifiedData);
    });
  });
};

// Function to send the modified HTML file as the response
const sendModifiedHTMLFile = (res, htmlFilePath) => {
  return new Promise((resolve, reject) => {
    res.sendFile(htmlFilePath, (err) => {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
};

// Function to delete a temporary file
const deleteTempFile = (tempFilePath) => {
  fs.unlink(tempFilePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    }
  });
};

const generateShortURLAndUpdateHomepage = async (req, res) => {
  const { longURL, customURL } = req.body;

  try {
    // Generate a new ShortURL document
    const newShortURL = await generateShortURL(longURL, customURL);

    // Associate the ShortURL with the user
    const userId = req.user._id;
    await associateShortURLWithUser(userId, newShortURL);

    // Retrieve the updated list of ShortURLs for the user
    const shortURLs = await getShortURLsForUser(userId);

    // Create the table rows from the database URLs
    const tbodyContent = shortURLs
      .map((url) => {
        return `
          <tr>
            <td>${url.longURL}</td>
            <td>${url.shortURL}</td>
            <td>${url.customURL || ""}</td>
            <td>${url.visits}</td>
            <td>
              <button class="generate-qr-button">Generate QR Code</button>
            </td>
          </tr>
        `;
      })
      .join("");

    // Read the HTML file
    const homePage = path.join(__dirname, "..", "public", "html", "Home.html");

    // Modify the HTML file with updated table rows
    const modifiedData = await modifyHTMLFile(homePage, tbodyContent);

    // Create a temporary file path
    const tempFilePath = path.join(os.tmpdir(), "modifiedHomePage.html");

    // Write the modified HTML to the temporary file
    fs.writeFile(tempFilePath, modifiedData, "utf8", (err) => {
      if (err) {
        console.error("Error writing file:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      // Send the modified HTML file as the response
      sendModifiedHTMLFile(res, tempFilePath)
        .then(() => {
          // Delete the temporary file after sending it
          deleteTempFile(tempFilePath);
        })
        .catch((err) => {
          console.error("Error sending file:", err);
          res.status(500).send("Internal Server Error");
        });
    });
  } catch (error) {
    console.error("Error generating short URL:", error);
    res.status(500).json({
      success: false,
      message: "Error generating short URL",
    });
  }
};

module.exports = { generateShortURLAndUpdateHomepage, generateQRCodeHandler };
