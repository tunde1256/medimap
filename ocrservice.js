const Tesseract = require('tesseract.js');

const ocrService = {
  async scan(imagePath) {
    try {
      // Use Tesseract.js to recognize text from the image
      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng', // You can specify the language here
        {
          logger: info => console.log(info) // Optional: log progress
        }
      );

      // Process the extracted text to find drug names (You may need to implement a more robust parsing logic)
      const drugNames = this.extractDrugNames(text);
      return drugNames;
    } catch (error) {
      throw new Error('Error scanning prescription: ' + error.message);
    }
  },

  // A simple function to extract drug names from the recognized text
  extractDrugNames(text) {
    // This is a placeholder. You can implement a more robust extraction logic based on your requirements.
    // For example, you might want to use regex or a specific format to parse the drug names.
    const drugNameRegex = /(?:Drug Name:|Medications:)\s*([^\n]+)/g;
    const matches = [];
    let match;

    while ((match = drugNameRegex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }

    return matches.length > 0 ? matches : ['No drug names found'];
  }
};

module.exports = ocrService;
