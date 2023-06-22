const ShortURL = require("../model/shortUrlModal");
const User = require("../model/userModel");
const path = require("path");
const fs = require("fs");
const os = require("os");
const QRCode = require('../model/qrCode')

const QRCode = require("../model/qrCode");
const redisClient = require("../config/redisClient");
const qrcode = require("qrcode");


const generateQRCode = (text) => {
  console.log(text);
  return new Promise((resolve, reject) => {
const generateQRCode = (text) => {
  console.log(text);
  return new Promise((resolve, reject) => {
    if (!text) {
      const error = new Error("Invalid input: text is empty or null");
      reject(error);
      reject(error);
      return;
    }

    // Generate QR code as an image file
    const filePath = `public/img/qrcode_${Date.now()}.png`; // File path to save the image
    qrcode.toFile(filePath, text, (error) => {
      if (error) {
        reject(error);
        return;
      }

      // Read the image file as binary data
      fs.readFile(filePath, (error, qrCodeData) => {
        if (error) {
          reject(error);
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

        resolve(qrCodeDataUrl);
      });
    });
  });
};

const generateQRCodeHandler = async (req, res) => {
  const text = req.body.text; // Access the input text from the request body or query parameters

  try {
    const qrCodeDataUrl = await generateQRCode(text);

    // QR code generated successfully
    console.log("QR code generated:", qrCodeDataUrl);

    // Associate the QR code with the user who generated it
    const userId = req.user._id; 
    const qrCode = new QRCode({
      user: userId,
      data: qrCodeDataUrl,
    });

    const savedQRCode = await qrCode.save();

    // Update the user's QR codes array with the new QR code
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { qrCodes: savedQRCode._id } },
      { new: true }
    );

    res.send(qrCodeDataUrl); // Send the updated user object as the response
  } catch (error) {
    console.error("Error generating or saving QR code:", error);
    res.sendStatus(500); // Send an appropriate error response
  }
};

// Function to generate a new ShortURL document
const generateShortURL = async (longURL, customURL) => {
  // Check if the custom URL already exists in the database
  // if (customURL) {
  //   const existingURL = await ShortURL.findOne({ customURL });
  //   if (existingURL) {
  //     throw new Error("Custom URL already exists");
  //   }
  // }
  // Check if the long URL already has a short URL in cache
  const cachedKey = `cached:${longURL}`;
  const cachedShortURL = await redisClient.get(cachedKey);
  if (cachedShortURL) {
    console.log("Short URL found in cache");
    return cachedShortURL;
  }

  // Check if the long URL already has a short URL in the database
  const existingShortURL = await ShortURL.findOne({ longURL });
  if (existingShortURL) {
    // Store the short URL in cache for future use
    redisClient.set(cachedKey, existingShortURL);
    return existingShortURL;
  }
  // Create a new ShortURL document1`
  const newShortURL = new ShortURL({
    longURL,
    customURL: customURL || undefined,
  });

  // Save the document to the database
  await newShortURL.save();
  // Set the short URL in cache
  // redisClient.set(cachedKey, newShortURL);
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
