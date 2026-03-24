/**
 * Captures a chart container element as a PNG data URL
 * Works by serializing the SVG rendered by recharts and drawing to canvas
 */
export async function captureChartAsImage(container: HTMLElement): Promise<string> {
  const svg = container.querySelector('svg');
  if (!svg) {
    // For table-based charts, use a simpler approach
    return captureHtmlAsImage(container);
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // retina quality
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    img.src = url;
  });
}

/**
 * Fallback: captures an HTML element (like a table) as a simple screenshot
 * Uses a canvas approach with foreignObject SVG wrapping
 */
async function captureHtmlAsImage(element: HTMLElement): Promise<string> {
  const { width, height } = element.getBoundingClientRect();
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.background = 'white';

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${element.innerHTML}</div>
      </foreignObject>
    </svg>`;

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to capture element'));
    };
    img.src = url;
  });
}
