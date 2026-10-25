import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { InvoiceSheetComponent } from '../../../shared/components/invoice-sheet/invoice-sheet';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrderService } from '../../../core/services/order.service';

export interface SaleDetailItem {
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleRecord {
  id: string;
  docType: 'Boleta' | 'Factura' | 'Nota';
  customer: string;
  docNumber: string;
  dateTime: string;
  isoDate: string;
  paymentMethod: string;
  channel: 'Tienda (POS)' | 'Web (Online)';
  cashier: string;
  total: number;
  items: SaleDetailItem[];
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [FormsModule, InvoiceSheetComponent, PaginationComponent],
  templateUrl: './sales.html',
  styleUrls: ['./sales.css'],
})
export class SalesComponent implements OnInit {
  // --- ESTADO REACTIVO (Signals) ---
  sales = signal<SaleRecord[]>([]);
  isLoading = signal<boolean>(true);

  filterDoc = signal<string>('Todos');
  searchQuery = signal<string>('');
  selectedDate = signal<string>('');

  currentPage = signal<number>(1);
  pageSize = 8;

  selectedSale: SaleRecord | null = null;
  isDownloadingPdf: boolean = false;
  docFilters: string[] = ['Todos', 'Boleta', 'Factura'];

  private orderService = inject(OrderService);

  // --- PROPIEDADES COMPUTADAS ---
  filteredSales = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const docF = this.filterDoc();
    const dateF = this.selectedDate();

    return this.sales().filter((s) => {
      const matchDoc = docF === 'Todos' || s.docType === docF;
      const matchDate = !dateF || s.isoDate === dateF;
      const matchSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.customer.toLowerCase().includes(q) ||
        s.docNumber.includes(q);

      return matchDoc && matchDate && matchSearch;
    });
  });

  paginatedSales = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSales().slice(startIndex, startIndex + this.pageSize);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredSales().length / this.pageSize) || 1;
  });

  // --- INICIALIZACIÓN ---
  ngOnInit(): void {
    this.cargarVentasReales();
  }

  cargarVentasReales(): void {
    this.isLoading.set(true);

    this.orderService.obtenerTodasLasOrdenes().subscribe({
      next: (data) => {
        const mappedSales: SaleRecord[] = data.map((o) => {
          const d = new Date(o.fechaRegistro || new Date());
          return {
            id: `ORD-${o.id.toString().padStart(6, '0')}`,
            docType: o.tipoComprobante || 'Boleta',
            customer:
              o.nombreCliente ||
              o.usuario?.nombreCompleto ||
              o.usuario?.email ||
              'Cliente No Registrado',
            docNumber: o.documentoCliente || o.usuario?.dni || '00000000',
            dateTime:
              d.toLocaleDateString('es-PE') +
              ' ' +
              d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            isoDate: d.toISOString().split('T')[0],
            paymentMethod: o.metodoPago || 'No especificado',
            channel: o.canal || 'Web (Online)',
            cashier: 'Sistema Web',
            total: o.total || 0,
            items:
              o.detalles?.map((det: any) => ({
                productName: det.producto?.nombre || 'Producto',
                qty: det.cantidad,
                unitPrice: det.precioUnitario,
                // CORRECCIÓN MATEMÁTICA
                subtotal: det.cantidad * det.precioUnitario,
              })) || [],
          };
        });

        this.sales.set(mappedSales);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando ventas', err);
        this.isLoading.set(false);
      },
    });
  }

  // --- INTERACCIONES ---
  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
  }

  updateFilterDoc(val: string): void {
    this.filterDoc.set(val);
    this.currentPage.set(1);
  }

  updateSearchQuery(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  updateDate(val: string): void {
    this.selectedDate.set(val);
    this.currentPage.set(1);
  }

  formatPrice(val: number): string {
    return (
      'S/ ' +
      (val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  getDocumentLabel(docNumber: string): string {
    if (!docNumber || docNumber === '00000000') return 'Sin documento';
    return docNumber.length === 11 ? `RUC: ${docNumber}` : `DNI: ${docNumber}`;
  }

  openSaleDetails(sale: SaleRecord): void {
    this.selectedSale = sale;
  }

  closeSaleDetails(): void {
    this.selectedSale = null;
  }

  // --- PDF ---
  printReceipt(): void {
    window.print();
  }

  downloadPdf(): void {
    if (!this.selectedSale) return;
    const element = document.querySelector('.print-document-container') as HTMLElement;
    if (!element) return;

    this.isDownloadingPdf = true;

    element.style.display = 'block';
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '-1';

    setTimeout(() => {
      html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 210;
          // CORRECCIÓN MATEMÁTICA
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight);
          pdf.save(`Comprobante_${this.selectedSale?.id}.pdf`);

          element.style.display = 'none';
          element.style.position = '';
          element.style.top = '';
          element.style.left = '';
          element.style.zIndex = '';
          this.isDownloadingPdf = false;
        })
        .catch(() => {
          this.isDownloadingPdf = false;
        });
    }, 50);
  }
}
