import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-sheet.html',
  styleUrls: ['./invoice-sheet.css'],
})
export class InvoiceSheetComponent {
  @Input() data: any = null;

  get subtotal(): number {
    return (this.data?.total || 0) / 1.18;
  }

  get igv(): number {
    return (this.data?.total || 0) - this.subtotal;
  }

  get series(): string {
    if (!this.data) return 'B001-0001';
    // Si ya viene con serie directa de ventas (ej: B001-00084 o F001-00019)
    if (this.data.id && (this.data.id.startsWith('B') || this.data.id.startsWith('F'))) {
      return this.data.id;
    }
    // Si viene de Pedidos (FM-1048)
    const isFactura =
      this.data.invoiceType === 'Factura electrónica' || this.data.docType === 'Factura';
    const numPart = (this.data.id || '').replace('FM-', '').padStart(6, '0');
    return isFactura ? `F001-${numPart}` : `B001-${numPart}`;
  }

  get isFactura(): boolean {
    return this.data?.invoiceType === 'Factura electrónica' || this.data?.docType === 'Factura';
  }

  formatPrice(val: number): string {
    return (
      'S/ ' +
      (val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }
}
