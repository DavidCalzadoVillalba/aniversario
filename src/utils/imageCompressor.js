/**
 * Helper to compress image files or base64 data URLs using HTML5 Canvas.
 * @param {File|Blob|string} imageInput - The image file, blob, or data URL string
 * @param {number} maxWidth - Maximum width allowed (default 1200px)
 * @param {number} quality - JPEG compression quality 0.0 to 1.0 (default 0.7)
 * @returns {Promise<string>} Base64 Data URL compressed image
 */
export function compressImage(imageInput, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const processImg = (src) => {
      const img = new Image();
      img.onerror = (err) => reject(new Error('Failed to load image for compression: ' + err));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while scaling down
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // White background for transparent PNGs converted to JPEG
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = src;
    };

    if (typeof imageInput === 'string') {
      processImg(imageInput);
    } else if (imageInput instanceof Blob || imageInput instanceof File) {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = (e) => processImg(e.target.result);
      reader.readAsDataURL(imageInput);
    } else {
      reject(new Error('Invalid image input type provided for compression.'));
    }
  });
}
