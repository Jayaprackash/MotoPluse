/**
 * MotoPulse - Bike Documents & Vault Engine
 */

const VaultEngine = {
  // Clean empty default documents list - user adds their own
  getDefaultDocuments() {
    return [];
  },

  // Calculate validity and days remaining for documents
  evaluateDocumentStatus(docs = []) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return docs.map(doc => {
      let badgeClass = 'active';
      let badgeText = 'Valid';
      let diffDays = null;

      if (doc.expiryDate) {
        const exp = new Date(doc.expiryDate);
        if (!isNaN(exp.getTime())) {
          diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            badgeClass = 'expired';
            badgeText = 'Expired';
          } else if (diffDays <= 30) {
            badgeClass = 'expiring';
            badgeText = `${diffDays}d left`;
          } else {
            badgeClass = 'active';
            badgeText = `${diffDays}d left`;
          }
        }
      } else {
        badgeClass = 'neutral';
        badgeText = 'No Expiry';
      }

      return {
        ...doc,
        diffDays,
        badgeClass,
        badgeText,
        hasFile: Boolean(doc.fileData)
      };
    });
  },

  // Client-side image compressor for safe offline storage
  compressFile(file, maxWidth = 1280, quality = 0.75) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file provided'));

      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = e => resolve({
          dataUrl: e.target.result,
          name: file.name,
          type: 'pdf',
          sizeKb: Math.round(file.size / 1024)
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            dataUrl,
            name: file.name,
            type: 'image',
            sizeKb: Math.round((dataUrl.length * 3 / 4) / 1024)
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
