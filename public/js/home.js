const shortURLTableBody = document.getElementById("shortURLTableBody");
shortURLTableBody.addEventListener("click", async function (event) {
  if (event.target.classList.contains("generate-qr-button")) {
    const shortURL = event.target
      .closest("tr")
      .querySelector("td:nth-child(1)").textContent;
    console.log(shortURL);
    const response = await fetch("/shortUrl/generateQrCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: shortURL }),
    });

    if (response.ok) {
      const qrCodeDataUrl = await response.text();
      console.log(qrCodeDataUrl);

      // Create a download button for the QR code image
      const downloadButton = document.createElement("button");
      downloadButton.textContent = "Download QR Code";
      downloadButton.classList.add("download-qr-button");

      // Add a click event listener to initiate the download
      downloadButton.addEventListener("click", function () {
        // Create a download link for the QR code image
        const link = document.createElement("a");
        link.href = qrCodeDataUrl;
        link.download = "qrcode.png";

        // Trigger a click event on the download link to initiate the download
        link.dispatchEvent(new MouseEvent("click"));
      });

      // Replace the "Generate QR Code" button with the download button
      const tableRow = event.target.closest("tr");
      const generateQRCodeCell =
        tableRow.querySelector("td:nth-child(5)");
      generateQRCodeCell.innerHTML = ""; // Clear the cell content
      generateQRCodeCell.appendChild(downloadButton);
    } else {
      console.error("Error generating QR code:", response.status);
    }
  }
});
