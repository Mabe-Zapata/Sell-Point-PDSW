import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice } from '../../domain/entities/invoice.entity';
import { InvoiceItem } from '../../domain/entities/invoice-item.entity';
import { IPdfService } from '../../application/services/pdf-service.interface';

type PDFKitDocument = InstanceType<typeof PDFDocument>;

@Injectable()
export class PdfService implements IPdfService {
  private readonly pageWidth = 595.28; // A4 width in points
  private readonly pageHeight = 841.89; // A4 height in points
  private readonly margin = 50;
  private readonly contentWidth: number;

  constructor() {
    this.contentWidth = this.pageWidth - this.margin * 2;
  }

  async generateInvoicePdf(
    invoice: Invoice,
    items: InvoiceItem[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: this.margin,
          info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: 'Sell Point POS',
            Subject: 'Invoice',
          },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', (error) => {
          reject(error);
        });

        // Build the PDF
        this.renderHeader(doc, invoice);
        this.renderCustomerInfo(doc, invoice);
        this.renderItemsTable(doc, items);
        this.renderTotals(doc, invoice);
        this.renderFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private renderHeader(doc: PDFKitDocument, invoice: Invoice): void {
    // Company name / Invoice title
    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('INVOICE', 0, this.margin, { align: 'center' });

    doc.moveDown(0.5);

    // Invoice number and date
    doc.font('Helvetica').fontSize(10);

    const invoiceNumberLabel = 'Invoice Number:';
    const invoiceNumberValue = invoice.invoiceNumber;
    const invoiceDateLabel = 'Date:';
    const invoiceDateValue = this.formatDate(invoice.invoiceDate);

    const leftCol = this.margin;
    const rightCol = this.pageWidth - this.margin - 150;

    doc.text(invoiceNumberLabel, leftCol, doc.y);
    doc.text(
      invoiceNumberValue,
      leftCol + doc.widthOfString(invoiceNumberLabel) + 5,
      doc.y,
    );

    doc.text(invoiceDateLabel, rightCol, doc.y - 10);
    doc.text(
      invoiceDateValue,
      rightCol + doc.widthOfString(invoiceDateLabel) + 5,
      doc.y,
    );

    doc.moveDown(1);
    doc
      .moveTo(this.margin, doc.y)
      .lineTo(this.pageWidth - this.margin, doc.y)
      .stroke();
    doc.moveDown(0.5);
  }

  private renderCustomerInfo(doc: PDFKitDocument, invoice: Invoice): void {
    doc.font('Helvetica-Bold').fontSize(12).text('Bill To:');
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10);

    if (invoice.customerName) {
      doc.text(invoice.customerName);
    }
    doc.text(`Customer ID: ${invoice.customerId}`);

    doc.moveDown(1);
  }

  private renderItemsTable(doc: PDFKitDocument, items: InvoiceItem[]): void {
    const tableTop = doc.y;
    const col1X = this.margin;
    const col2X = this.margin + 250;
    const col3X = this.margin + 320;
    const col4X = this.margin + 400;
    const col5X = this.margin + 480;

    // Table header
    doc.font('Helvetica-Bold').fontSize(10);

    doc.text('#', col1X, tableTop, { width: 20, align: 'left' });
    doc.text('Description', col2X, tableTop, { width: 140, align: 'left' });
    doc.text('Qty', col3X, tableTop, { width: 60, align: 'right' });
    doc.text('Unit Price', col4X, tableTop, { width: 70, align: 'right' });
    doc.text('Amount', col5X, tableTop, { width: 65, align: 'right' });

    doc.moveDown(0.3);
    doc
      .moveTo(this.margin, doc.y)
      .lineTo(this.pageWidth - this.margin, doc.y)
      .stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(10);

    let rowY = doc.y;
    items.forEach((item, index) => {
      // Check if we need a new page
      if (rowY > this.pageHeight - 150) {
        doc.addPage();
        rowY = this.margin;
      }

      const itemTotal = item.unitPrice * item.quantity;
      const description =
        item.productName || `Product: ${item.productId.substring(0, 8)}`;

      doc.text((index + 1).toString(), col1X, rowY, {
        width: 20,
        align: 'left',
      });
      doc.text(this.truncateText(description, 30), col2X, rowY, {
        width: 140,
        align: 'left',
      });
      doc.text(item.quantity.toString(), col3X, rowY, {
        width: 60,
        align: 'right',
      });
      doc.text(this.formatCurrency(item.unitPrice), col4X, rowY, {
        width: 70,
        align: 'right',
      });
      doc.text(this.formatCurrency(itemTotal), col5X, rowY, {
        width: 65,
        align: 'right',
      });

      rowY += 20;
    });

    doc.y = rowY + 10;
  }

  private renderTotals(doc: PDFKitDocument, invoice: Invoice): void {
    const totalsX = this.margin + 350;
    const labelX = totalsX;
    const valueX = totalsX + 80;

    doc.moveDown(0.5);
    doc
      .moveTo(totalsX - 10, doc.y)
      .lineTo(this.pageWidth - this.margin, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // Subtotal
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', labelX, doc.y);
    doc.text(this.formatCurrency(invoice.subtotal), valueX, doc.y, {
      width: 80,
      align: 'right',
    });

    doc.moveDown(0.5);

    // IVA
    doc.text('IVA:', labelX, doc.y);
    doc.text(this.formatCurrency(invoice.iva), valueX, doc.y, {
      width: 80,
      align: 'right',
    });

    doc.moveDown(0.5);

    // Total line
    doc
      .moveTo(totalsX - 10, doc.y + 5)
      .lineTo(this.pageWidth - this.margin, doc.y + 5)
      .stroke();

    // Total
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Total:', labelX, doc.y + 10);
    doc.text(this.formatCurrency(invoice.total), valueX, doc.y + 10, {
      width: 80,
      align: 'right',
    });
  }

  private renderFooter(doc: PDFKitDocument): void {
    const footerY = this.pageHeight - 80;

    doc.font('Helvetica').fontSize(9);
    doc.text('Thank you for your business!', this.margin, footerY, {
      align: 'center',
      width: this.contentWidth,
    });

    doc.moveDown(0.5);
    doc.fontSize(8);
    doc.text('Sell Point POS System', this.margin, doc.y, {
      align: 'center',
      width: this.contentWidth,
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
