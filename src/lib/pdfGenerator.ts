import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DocumentBlock, DocumentLanguageView, DocumentMetadata } from '../types/document';

// Helper to remove accents if rendering with standard 14 WinAnsi fonts in pdf-lib
// or providing clean UTF-8 text representations
function cleanAscii(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[„“]/g, '"')
    .replace(/[‚‘]/g, "'")
    .replace(/[–—]/g, '-');
}

export async function generateInteractiveFormPdf(
  metadata: DocumentMetadata,
  blocks: DocumentBlock[],
  languageView: DocumentLanguageView
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Page dimensions (A4: 595.28 x 841.89 pt, Letter: 612 x 792 pt)
  const isA4 = metadata.pageSize === 'A4';
  const width = metadata.orientation === 'portrait' ? (isA4 ? 595.28 : 612) : (isA4 ? 841.89 : 792);
  const height = metadata.orientation === 'portrait' ? (isA4 ? 841.89 : 792) : (isA4 ? 595.28 : 612);

  const margin = 48;
  const contentWidth = width - margin * 2;

  // Standard fonts
  const fontRegular = await pdfDoc.embedFont(
    metadata.fontFamily === 'serif' ? StandardFonts.TimesRoman :
    metadata.fontFamily === 'mono' ? StandardFonts.Courier :
    StandardFonts.Helvetica
  );

  const fontBold = await pdfDoc.embedFont(
    metadata.fontFamily === 'serif' ? StandardFonts.TimesRomanBold :
    metadata.fontFamily === 'mono' ? StandardFonts.CourierBold :
    StandardFonts.HelveticaBold
  );

  const fontItalic = await pdfDoc.embedFont(
    metadata.fontFamily === 'serif' ? StandardFonts.TimesRomanItalic :
    metadata.fontFamily === 'mono' ? StandardFonts.CourierOblique :
    StandardFonts.HelveticaOblique
  );

  // Initialize interactive PDF Form (AcroForm)
  const form = pdfDoc.getForm();

  let currentPage = pdfDoc.addPage([width, height]);
  let currentY = height - margin;

  // Header helper
  const drawPageHeader = (page: typeof currentPage, pageNum: number) => {
    if (metadata.headerText) {
      page.drawText(cleanAscii(metadata.headerText), {
        x: margin,
        y: height - 28,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5),
      });
      page.drawLine({
        start: { x: margin, y: height - 34 },
        end: { x: width - margin, y: height - 34 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
    }

    if (metadata.showPageNumbers) {
      page.drawText(`Strana ${pageNum}`, {
        x: width - margin - 50,
        y: 24,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    if (metadata.footerText) {
      page.drawText(cleanAscii(metadata.footerText), {
        x: margin,
        y: 24,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawLine({
        start: { x: margin, y: 36 },
        end: { x: width - margin, y: 36 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
    }
  };

  let pageIndex = 1;
  drawPageHeader(currentPage, pageIndex);

  const checkPageSpace = (neededHeight: number) => {
    if (currentY - neededHeight < margin + 40) {
      currentPage = pdfDoc.addPage([width, height]);
      pageIndex++;
      drawPageHeader(currentPage, pageIndex);
      currentY = height - margin - 20;
    }
  };

  // Helper to split text into wrapped lines
  const wrapText = (text: string, font: typeof fontRegular, fontSize: number, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(cleanAscii(testLine), fontSize);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // 1. Draw Document Header Card
  if (metadata.showSourceHeader) {
    checkPageSpace(50);
    currentPage.drawRectangle({
      x: margin,
      y: currentY - 32,
      width: contentWidth,
      height: 32,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.75,
    });

    currentPage.drawText(`ZDROJ: ${cleanAscii(metadata.sourceUrl || 'Web Document')} | AUTOR: ${cleanAscii(metadata.author)} | DATUM: ${cleanAscii(metadata.date)}`, {
      x: margin + 10,
      y: currentY - 20,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    });
    currentY -= 44;
  }

  // 2. Iterate Blocks
  for (const block of blocks) {
    const textToUse =
      languageView === 'slovak'
        ? (block.slovakContent || block.content || '')
        : languageView === 'original'
        ? (block.originalContent || block.content || '')
        : `${block.slovakContent || block.content || ''}\n[Povodny text / Original: ${block.originalContent || block.content || ''}]`;

    if (block.type === 'page-break') {
      currentPage = pdfDoc.addPage([width, height]);
      pageIndex++;
      drawPageHeader(currentPage, pageIndex);
      currentY = height - margin - 20;
      continue;
    }

    if (block.type === 'divider') {
      checkPageSpace(16);
      currentPage.drawLine({
        start: { x: margin, y: currentY - 8 },
        end: { x: width - margin, y: currentY - 8 },
        thickness: 0.75,
        color: rgb(0.85, 0.88, 0.92),
      });
      currentY -= 20;
      continue;
    }

    if (block.type === 'h1') {
      const fontSize = 20;
      const lines = wrapText(cleanAscii(textToUse), fontBold, fontSize, contentWidth);
      const neededHeight = lines.length * 24 + 14;
      checkPageSpace(neededHeight);

      for (const line of lines) {
        currentPage.drawText(line, {
          x: margin,
          y: currentY - 18,
          size: fontSize,
          font: fontBold,
          color: rgb(0.08, 0.12, 0.18),
        });
        currentY -= 24;
      }
      currentY -= 10;
    } else if (block.type === 'h2') {
      const fontSize = 14;
      const lines = wrapText(cleanAscii(textToUse), fontBold, fontSize, contentWidth);
      const neededHeight = lines.length * 18 + 10;
      checkPageSpace(neededHeight);

      for (const line of lines) {
        currentPage.drawText(line, {
          x: margin,
          y: currentY - 14,
          size: fontSize,
          font: fontBold,
          color: rgb(0.12, 0.16, 0.22),
        });
        currentY -= 18;
      }
      currentY -= 6;
    } else if (block.type === 'h3') {
      const fontSize = 11;
      const lines = wrapText(cleanAscii(textToUse), fontBold, fontSize, contentWidth);
      const neededHeight = lines.length * 15 + 6;
      checkPageSpace(neededHeight);

      for (const line of lines) {
        currentPage.drawText(line, {
          x: margin,
          y: currentY - 11,
          size: fontSize,
          font: fontBold,
          color: rgb(0.2, 0.25, 0.3),
        });
        currentY -= 15;
      }
      currentY -= 4;
    } else if (block.type === 'paragraph') {
      const fontSize = 10;
      const lines = wrapText(cleanAscii(textToUse), fontRegular, fontSize, contentWidth);
      const neededHeight = lines.length * 14 + 8;
      checkPageSpace(neededHeight);

      for (const line of lines) {
        currentPage.drawText(line, {
          x: margin,
          y: currentY - 10,
          size: fontSize,
          font: fontRegular,
          color: rgb(0.2, 0.23, 0.27),
        });
        currentY -= 14;
      }
      currentY -= 6;
    } else if (block.type === 'quote' || block.type === 'callout') {
      const fontSize = 9.5;
      const lines = wrapText(cleanAscii(textToUse), fontItalic, fontSize, contentWidth - 30);
      const boxHeight = lines.length * 14 + 16;
      checkPageSpace(boxHeight + 10);

      // Clean background box with hairline border
      currentPage.drawRectangle({
        x: margin,
        y: currentY - boxHeight,
        width: contentWidth,
        height: boxHeight,
        color: block.type === 'callout' ? rgb(0.96, 0.98, 1.0) : rgb(0.98, 0.98, 0.99),
        borderColor: rgb(0.82, 0.86, 0.92),
        borderWidth: 0.75,
      });

      let textY = currentY - 14;
      for (const line of lines) {
        currentPage.drawText(line, {
          x: margin + 14,
          y: textY,
          size: fontSize,
          font: fontItalic,
          color: rgb(0.2, 0.28, 0.38),
        });
        textY -= 14;
      }
      currentY -= boxHeight + 12;
    } else if (block.type === 'list') {
      const items =
        languageView === 'slovak'
          ? (block.slovakListItems || block.listItems || [])
          : (block.originalListItems || block.listItems || []);

      for (let i = 0; i < items.length; i++) {
        const itemText = items[i];
        const prefix = block.listType === 'ordered' ? `${i + 1}. ` : '• ';
        const fontSize = 9.5;
        const lines = wrapText(cleanAscii(itemText), fontRegular, fontSize, contentWidth - 24);
        const neededHeight = lines.length * 14 + 4;
        checkPageSpace(neededHeight);

        currentPage.drawText(prefix, {
          x: margin + 4,
          y: currentY - 10,
          size: fontSize,
          font: fontBold,
          color: rgb(0.2, 0.4, 0.7),
        });

        for (let j = 0; j < lines.length; j++) {
          currentPage.drawText(lines[j], {
            x: margin + 20,
            y: currentY - 10,
            size: fontSize,
            font: fontRegular,
            color: rgb(0.2, 0.23, 0.27),
          });
          currentY -= 14;
        }
        currentY -= 3;
      }
      currentY -= 6;
    } else if (block.type === 'table') {
      const tableData =
        languageView === 'slovak'
          ? (block.slovakTableData || block.tableData)
          : (block.originalTableData || block.tableData);

      if (tableData && tableData.headers && tableData.headers.length > 0) {
        const colCount = tableData.headers.length;
        const colWidth = contentWidth / colCount;
        const rowHeight = 20;

        checkPageSpace(rowHeight * (tableData.rows.length + 1) + 12);

        // Header Row
        currentPage.drawRectangle({
          x: margin,
          y: currentY - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.93, 0.95, 0.98),
          borderColor: rgb(0.8, 0.84, 0.9),
          borderWidth: 0.75,
        });

        tableData.headers.forEach((h, colIdx) => {
          const cleanH = cleanAscii(h);
          currentPage.drawText(cleanH.length > 25 ? cleanH.substring(0, 25) + '...' : cleanH, {
            x: margin + colIdx * colWidth + 6,
            y: currentY - 14,
            size: 8.5,
            font: fontBold,
            color: rgb(0.15, 0.2, 0.28),
          });
        });
        currentY -= rowHeight;

        // Rows
        tableData.rows.forEach((row, rowIdx) => {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - rowHeight,
            width: contentWidth,
            height: rowHeight,
            color: rowIdx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.99),
            borderColor: rgb(0.88, 0.9, 0.93),
            borderWidth: 0.5,
          });

          row.forEach((cell, colIdx) => {
            const cleanC = cleanAscii(cell);
            currentPage.drawText(cleanC.length > 28 ? cleanC.substring(0, 28) + '...' : cleanC, {
              x: margin + colIdx * colWidth + 6,
              y: currentY - 14,
              size: 8,
              font: fontRegular,
              color: rgb(0.2, 0.23, 0.27),
            });
          });
          currentY -= rowHeight;
        });
        currentY -= 10;
      }
    } else if (block.type === 'form-field' && block.formField) {
      // INTERACTIVE ACROFORM FIELD CREATION
      const ff = block.formField;
      checkPageSpace(50);

      // Label
      currentPage.drawText(cleanAscii(ff.label), {
        x: margin,
        y: currentY - 10,
        size: 9,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.28),
      });
      currentY -= 16;

      const uniqueFieldName = `${ff.fieldName || 'field'}_${block.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

      if (ff.type === 'checkbox') {
        const checkBox = form.createCheckBox(uniqueFieldName);
        checkBox.addToPage(currentPage, {
          x: margin,
          y: currentY - 14,
          width: 14,
          height: 14,
          borderWidth: 1,
          borderColor: rgb(0.3, 0.4, 0.6),
          backgroundColor: rgb(0.98, 0.99, 1),
        });
        if (ff.checked) {
          checkBox.check();
        }

        currentPage.drawText(cleanAscii(ff.placeholder || 'Suhlasim / Agreed'), {
          x: margin + 22,
          y: currentY - 11,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.3, 0.35, 0.4),
        });
        currentY -= 24;
      } else if (ff.type === 'textarea') {
        const textField = form.createTextField(uniqueFieldName);
        textField.enableMultiline();
        if (ff.defaultValue) textField.setText(cleanAscii(ff.defaultValue));
        textField.addToPage(currentPage, {
          x: margin,
          y: currentY - 44,
          width: contentWidth,
          height: 44,
          borderWidth: 0.75,
          borderColor: rgb(0.7, 0.75, 0.85),
          backgroundColor: rgb(0.99, 0.99, 1),
        });
        currentY -= 54;
      } else {
        // text, date, signature
        const textField = form.createTextField(uniqueFieldName);
        if (ff.defaultValue) textField.setText(cleanAscii(ff.defaultValue));
        textField.addToPage(currentPage, {
          x: margin,
          y: currentY - 22,
          width: contentWidth,
          height: 22,
          borderWidth: 0.75,
          borderColor: rgb(0.7, 0.75, 0.85),
          backgroundColor: rgb(0.99, 0.99, 1),
        });
        currentY -= 30;
      }
    }
  }

  return await pdfDoc.save();
}

// Download PDF as file
export function triggerPdfDownload(pdfBytes: Uint8Array, filename: string = 'web-document.pdf') {
  // Use a Blob and object URL for download
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Print document directly using browser's vector print engine
export function printDocument() {
  window.print();
}

// Export Project JSON
export function exportProjectJson(metadata: DocumentMetadata, blocks: DocumentBlock[]) {
  const data = JSON.stringify({ metadata, blocks, exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'document'}.webpdf.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
