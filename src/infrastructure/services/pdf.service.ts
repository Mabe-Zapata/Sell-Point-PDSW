/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice, InvoiceItem } from '../../domain/entities';
import { IPdfService } from '../../application/services/pdf-service.interface';

type PDFKitDocument = InstanceType<typeof PDFDocument>;

@Injectable()
export class PdfService implements IPdfService {
  // ─── Layout constants ────────────────────────────────────────────────────────
  private readonly W = 595.28;   // A4 width  (pts)
  private readonly H = 841.89;   // A4 height (pts)
  private readonly ML = 50;      // margin left
  private readonly MR = 50;      // margin right
  private readonly CW: number;   // content width

  // Column X positions for item table
  private readonly COL = {
    num:       50,
    desc:      78,
    qty:       355,
    price:     410,
    subtotal:  480,
  };

  constructor() {
    this.CW = this.W - this.ML - this.MR;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────
  async generateInvoicePdf(invoice: Invoice, items: InvoiceItem[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,             // we control all margins manually
          info: {
            Title: `Factura ${invoice.invoiceNumber}`,
            Author: 'Sell Point POS',
            Subject: 'Factura de venta',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end',  () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.renderHeader(doc, invoice);
        this.renderMeta(doc, invoice);
        this.renderDivider(doc);
        this.renderCustomer(doc, invoice);
        this.renderItemsTable(doc, items);
        this.renderTotals(doc, invoice);
        this.renderFooter(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─── Header band ─────────────────────────────────────────────────────────────
  private renderHeader(doc: PDFKitDocument, invoice: Invoice): void {
    // Black top band
    doc.rect(0, 0, this.W, 90).fill('#111111');

    // Company name — left
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('SELL POINT', this.ML, 28, { lineBreak: false });

    // "FACTURA" label — right
    doc
      .fontSize(11)
      .font('Helvetica')
      .text('FACTURA DE VENTA', this.W - this.MR - 160, 24, {
        width: 160,
        align: 'right',
        lineBreak: false,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(invoice.invoiceNumber, this.W - this.MR - 160, 40, {
        width: 160,
        align: 'right',
        lineBreak: false,
      });

    doc.fillColor('#000000');
  }

  // ─── Meta row (fecha + estado) ────────────────────────────────────────────────
  private renderMeta(doc: PDFKitDocument, invoice: Invoice): void {
    const y = 108;

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555555')
      .text('FECHA DE EMISIÓN', this.ML, y, { lineBreak: false });

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111111')
      .text(this.formatDate(invoice.invoiceDate ?? invoice.issueDate ?? new Date()), this.ML, y + 12, {
        lineBreak: false,
      });

    // Status badge
    const badgeX = this.W - this.MR - 80;
    doc.rect(badgeX, y - 2, 80, 22).fill('#111111');
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#ffffff')
      .text('PROCESADA', badgeX, y + 5, { width: 80, align: 'center', lineBreak: false });

    doc.fillColor('#000000');
  }

  // ─── Thin divider ─────────────────────────────────────────────────────────────
  private renderDivider(doc: PDFKitDocument, y?: number): void {
    const posY = y ?? doc.y;
    doc
      .moveTo(this.ML, posY)
      .lineTo(this.W - this.MR, posY)
      .lineWidth(0.5)
      .strokeColor('#cccccc')
      .stroke();
    doc.strokeColor('#000000');
  }

  // ─── Customer block ───────────────────────────────────────────────────────────
  private renderCustomer(doc: PDFKitDocument, invoice: Invoice): void {
    const y = 155;

    // Left column — FACTURADO A
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#888888')
      .text('FACTURADO A', this.ML, y);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#111111')
      .text(invoice.customerName ?? 'Cliente', this.ML, y + 14);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(`ID: ${invoice.customerId ?? invoice.saleId ?? ''}`, this.ML, y + 30);

    // Right column — thin box with totals preview
    const boxX = this.W - this.MR - 170;
    doc.rect(boxX, y - 4, 170, 54).lineWidth(0.5).strokeColor('#cccccc').stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#888888')
      .text('MONTO TOTAL', boxX + 12, y + 4);

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#111111')
      .text(this.formatCurrency(invoice.total ?? 0), boxX + 12, y + 18, {
        width: 146,
        align: 'right',
      });

    doc.fillColor('#000000').strokeColor('#000000').lineWidth(1);

    // Section divider before table
    doc.y = y + 68;
  }

  // ─── Items table ──────────────────────────────────────────────────────────────
  private renderItemsTable(doc: PDFKitDocument, items: InvoiceItem[]): void {
    const tableY = doc.y;

    // Header background
    doc.rect(this.ML, tableY, this.CW, 22).fill('#111111');

    const hY = tableY + 6;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
    doc.text('#',           this.COL.num,      hY, { width: 24,  align: 'center', lineBreak: false });
    doc.text('DESCRIPCIÓN', this.COL.desc,     hY, { width: 272, align: 'left',   lineBreak: false });
    doc.text('CANT.',       this.COL.qty,      hY, { width: 50,  align: 'right',  lineBreak: false });
    doc.text('P. UNITARIO', this.COL.price,    hY, { width: 65,  align: 'right',  lineBreak: false });
    doc.text('SUBTOTAL',    this.COL.subtotal, hY, { width: 60,  align: 'right',  lineBreak: false });

    doc.fillColor('#000000');

    let rowY = tableY + 26;
    const rowH = 24;

    items.forEach((item, idx) => {
      // New page guard
      if (rowY > this.H - 160) {
        doc.addPage();
        rowY = 50;
      }

      // Alternating row background
      if (idx % 2 === 0) {
        doc.rect(this.ML, rowY - 4, this.CW, rowH).fill('#f7f7f7');
      }

      const lotSuffix = item.lotCodes?.length ? ` | Lotes: ${item.lotCodes.join(', ')}` : '';
      const desc = `${item.productName ?? `Producto ${item.productId.slice(0, 8)}`}${lotSuffix}`;
      const lineTotal = item.unitPrice * item.quantity;

      doc.font('Helvetica').fontSize(9).fillColor('#111111');
      doc.text(String(idx + 1),                   this.COL.num,      rowY, { width: 24,  align: 'center', lineBreak: false });
      doc.text(this.truncate(desc, 44),            this.COL.desc,     rowY, { width: 272, align: 'left',   lineBreak: false });
      doc.text(String(item.quantity),              this.COL.qty,      rowY, { width: 50,  align: 'right',  lineBreak: false });
      doc.text(this.formatCurrency(item.unitPrice),this.COL.price,    rowY, { width: 65,  align: 'right',  lineBreak: false });
      doc.text(this.formatCurrency(lineTotal),     this.COL.subtotal, rowY, { width: 60,  align: 'right',  lineBreak: false });

      // Bottom border per row
      doc
        .moveTo(this.ML, rowY + rowH - 5)
        .lineTo(this.W - this.MR, rowY + rowH - 5)
        .lineWidth(0.3)
        .strokeColor('#e0e0e0')
        .stroke();

      rowY += rowH;
    });

    doc.strokeColor('#000000').lineWidth(1);
    doc.y = rowY + 8;
  }

  // ─── Totals block ─────────────────────────────────────────────────────────────
  private renderTotals(doc: PDFKitDocument, invoice: Invoice): void {
    const startY = doc.y + 10;
    const labelX = this.W - this.MR - 220;
    const valueX = this.W - this.MR - 80;
    const valueW = 80;

    const row = (label: string, value: string, y: number, bold = false): void => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 10 : 9)
        .fillColor('#444444')
        .text(label, labelX, y, { width: 130, align: 'left', lineBreak: false });
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 11 : 9)
        .fillColor('#111111')
        .text(value, valueX, y, { width: valueW, align: 'right', lineBreak: false });
    };

    row('Subtotal',   this.formatCurrency(invoice.subtotal ?? 0), startY);
    row('IVA',        this.formatCurrency(invoice.iva ?? 0),      startY + 18);

    // Divider
    const divY = startY + 40;
    doc
      .moveTo(labelX, divY)
      .lineTo(this.W - this.MR, divY)
      .lineWidth(1)
      .strokeColor('#111111')
      .stroke();

    // Total row on black band
    doc.rect(labelX - 8, divY + 4, this.W - this.MR - labelX + 8, 28).fill('#111111');
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#ffffff')
      .text('TOTAL', labelX, divY + 11, { width: 130, align: 'left', lineBreak: false });
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#ffffff')
      .text(this.formatCurrency(invoice.total ?? 0), valueX, divY + 9, {
        width: valueW,
        align: 'right',
        lineBreak: false,
      });

    doc.fillColor('#000000').strokeColor('#000000').lineWidth(1);
    doc.y = divY + 44;
  }

  // ─── Footer ───────────────────────────────────────────────────────────────────
  private renderFooter(doc: PDFKitDocument): void {
    const footerY = this.H - 55;

    doc
      .moveTo(this.ML, footerY)
      .lineTo(this.W - this.MR, footerY)
      .lineWidth(0.5)
      .strokeColor('#cccccc')
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#888888')
      .text(
        '¡Gracias por su compra! — Este documento es un comprobante de venta generado por Sell Point POS.',
        this.ML,
        footerY + 10,
        { width: this.CW, align: 'center', lineBreak: false },
      );

    doc
      .fontSize(7)
      .text(
        `Generado el ${this.formatDate(new Date())} · Sell Point v1.0`,
        this.ML,
        footerY + 26,
        { width: this.CW, align: 'center', lineBreak: false },
      );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  private formatDate(date: Date): string {
    const d = new Date(date);
    return [
      d.getDate().toString().padStart(2, '0'),
      (d.getMonth() + 1).toString().padStart(2, '0'),
      d.getFullYear(),
    ].join('/');
  }

  private formatCurrency(amount: number): string {
    return `$${Number(amount).toFixed(2)}`;
  }

  private truncate(text: string, max: number): string {
    return text.length <= max ? text : text.slice(0, max - 3) + '...';
  }
}
