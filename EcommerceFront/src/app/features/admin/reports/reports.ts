import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { forkJoin } from 'rxjs'; // <-- NUEVA IMPORTACIÓN

import { OrderService } from '../../../core/services/order.service';
import { CategoriaService } from '../../../core/services/categoria.service'; // <-- IMPORTA EL SERVICIO

export interface CategorySalesMetric {
  name: string;
  amount: number;
  percentage: number;
}

export interface DownloadableReport {
  id: string;
  title: string;
  fileName: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
})
export class ReportsComponent implements OnInit {
  realOrders = signal<any[]>([]);

  monthlyRevenue = signal<number>(0);
  revenueGrowth = signal<number>(0);
  marginRate = signal<number>(0);
  marginGrowth = signal<number>(0);
  completedOrders = signal<number>(0);
  pickupRate = signal<number>(0);

  categoryMetrics = signal<CategorySalesMetric[]>([]);

  reportsList = signal<DownloadableReport[]>([
    { id: 'sales-month', title: 'Ventas históricas (Real)', fileName: 'reporte_ventas_ferremas' },
    { id: 'stock-movements', title: 'Movimientos de inventario', fileName: 'kardex_inventario' },
    { id: 'orders-pickup', title: 'Pedidos y retiros', fileName: 'pedidos_mostrador' },
    { id: 'clients-retention', title: 'Clientes y recurrencia', fileName: 'clientes_frecuencia' },
  ]);

  toastMessage = signal<string | null>(null);
  private toastTimer: any = null;

  private orderService = inject(OrderService);
  private categoriaService = inject(CategoriaService); // <-- INYECTAR SERVICIO DE CATEGORÍAS
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarMeticasReales();
  }

  cargarMeticasReales(): void {
    // forkJoin ejecuta ambas peticiones al mismo tiempo y espera a que ambas terminen
    forkJoin({
      categorias: this.categoriaService.obtenerCategorias(),
      ordenes: this.orderService.obtenerTodasLasOrdenes()
    }).subscribe({
      next: ({ categorias, ordenes }) => {
        this.realOrders.set(ordenes);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        let thisMonthMargin = 0;
        let lastMonthMargin = 0;
        let pickedUpCount = 0;

        // 1. INICIALIZAMOS EL MAPA CON TODAS LAS CATEGORÍAS REALES EN CERO
        const catMap = new Map<string, number>();
        categorias.forEach(cat => {
          if (cat.activo !== false) { // Incluimos solo las activas
            catMap.set(cat.nombre, 0);
          }
        });

        // 2. PROCESAMOS LAS ÓRDENES Y CALCULAMOS KPIs
        ordenes.forEach((orden) => {
          const total = orden.total || 0;
          const fecha = new Date(orden.fechaRegistro || orden.fechaOrden || new Date());
          const isThisMonth = fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
          const isLastMonth = fecha.getMonth() === lastMonth && fecha.getFullYear() === lastMonthYear;

          const mockCost = total * 0.68;
          const margin = total - mockCost;

          if (isThisMonth) {
            thisMonthRevenue += total;
            thisMonthMargin += margin;
          } else if (isLastMonth) {
            lastMonthRevenue += total;
            lastMonthMargin += margin;
          }

          if (['ENTREGADO', 'LISTO_PARA_RECOJO'].includes(orden.estado) || orden.canal === 'Tienda (POS)') {
            pickedUpCount++;
          }

          // Sumamos los ingresos al mapa de categorías
          if (orden.detalles) {
            orden.detalles.forEach((det: any) => {
              const catName = det.producto?.categoria?.nombre || 'General';
              const subtotal = (det.cantidad || 1) * (det.precioUnitario || 0);

              // Sumamos al valor existente (si la categoría no existía en la BD, la añade)
              const current = catMap.get(catName) || 0;
              catMap.set(catName, current + subtotal);
            });
          }
        });

        // 3. ASIGNACIÓN DE KPIs AL ESTADO REACTIVO
        const revenueToDisplay = thisMonthRevenue > 0 ? thisMonthRevenue : ordenes.reduce((s, o) => s + (o.total || 0), 0);
        this.monthlyRevenue.set(revenueToDisplay);
        this.completedOrders.set(ordenes.length);

        if (lastMonthRevenue > 0) {
          const growth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
          this.revenueGrowth.set(Math.round(growth * 10) / 10);
        } else {
          this.revenueGrowth.set(thisMonthRevenue > 0 ? 100 : 0);
        }

        const rate = revenueToDisplay > 0 ? (thisMonthMargin / thisMonthRevenue) * 100 : 0;
        this.marginRate.set(Math.round(rate * 10) / 10);
        const lastRate = lastMonthRevenue > 0 ? (lastMonthMargin / lastMonthRevenue) * 100 : 0;
        this.marginGrowth.set(Math.round((this.marginRate() - lastRate) * 10) / 10);

        const pickupPct = ordenes.length > 0 ? (pickedUpCount / ordenes.length) * 100 : 0;
        this.pickupRate.set(Math.round(pickupPct * 10) / 10);

        // 4. CREACIÓN DEL ARRAY FINAL DE CATEGORÍAS (Convertimos a %)
        const totalAllTime = ordenes.reduce((sum, o) => sum + (o.total || 0), 0);
        const catArray: CategorySalesMetric[] = [];

        catMap.forEach((monto, nombre) => {
          const pct = totalAllTime > 0 ? Math.round((monto / totalAllTime) * 100) : 0;
          catArray.push({ name: nombre, amount: monto, percentage: pct });
        });

        // Ordenamos: Primero por monto de ventas (mayor a menor), y luego alfabéticamente si ambas tienen 0
        catArray.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
        this.categoryMetrics.set(catArray);
      },
      error: (err) => console.error('Error al cruzar reportes con categorías', err),
    });
  }

  formatCurrency(val: number): string {
    return 'S/ ' + val.toLocaleString('es-PE', { maximumFractionDigits: 0 });
  }

  formatMillions(val: number): string {
    // Si el monto es menor a 1 millón, lo muestra normal. Si es mayor, lo formatea con "M".
    if (val < 1000000) {
      return (
        'S/ ' + val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
    }
    const calc = val / 1000000;
    return (
      'S/ ' +
      calc.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      ' M'
    );
  }

  // Lógica de Descarga
  downloadReport(report: DownloadableReport): void {
    let reportData: any[] = [];
    let sheetName = 'Reporte';

    switch (report.id) {
      case 'sales-month':
        sheetName = 'Ventas Reales';
        reportData = this.getRealSalesData(); // AHORA ES REAL
        break;
      case 'stock-movements':
        sheetName = 'Inventario';
        reportData = this.getInventoryData();
        break;
      case 'orders-pickup':
        sheetName = 'Pedidos';
        reportData = this.getOrdersPickupData();
        break;
      case 'clients-retention':
        sheetName = 'Clientes';
        reportData = this.getClientsData();
        break;
      default:
        reportData = [{ Mensaje: 'Sin datos disponibles' }];
    }

    this.exportToExcel(reportData, report.fileName, sheetName);
    this.triggerToast(`Descargando "${report.title}" en formato Excel (.xlsx)...`);
  }

  private exportToExcel(data: any[], fileName: string, sheetName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    if (data.length > 0) {
      const colWidths = Object.keys(data[0]).map((key) => ({
        wch: Math.max(key.length + 5, 20),
      }));
      worksheet['!cols'] = colWidths;
    }

    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  // ── DATA DINÁMICA DE BASE DE DATOS ──

  // 1. Reporte de Ventas (Ya estaba conectado)
  private getRealSalesData(): any[] {
    return this.realOrders().map((o) => {
      const d = new Date(o.fechaRegistro || new Date());
      const strFecha =
        d.toLocaleDateString('es-PE') +
        ' ' +
        d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const numSerie = `ORD-${o.id.toString().padStart(6, '0')}`;

      return {
        'N° Comprobante': numSerie,
        'Fecha / Hora': strFecha,
        'Tipo Doc': o.tipoComprobante || 'Boleta',
        Cliente:
          o.nombreCliente || o.usuario?.nombreCompleto || o.usuario?.email || 'Público General',
        'Doc. Identidad': o.documentoCliente || o.usuario?.dni || '00000000',
        Canal: o.canal || 'Web (Online)',
        'Método Pago': o.metodoPago || 'No especificado',
        'Total (S/)': o.total || 0,
      };
    });
  }

  // 2. Reporte de Inventario Real (Basado en lo vendido)
  private getInventoryData(): any[] {
    const inventarioMap = new Map<number, any>();

    this.realOrders().forEach((orden) => {
      if (orden.detalles) {
        orden.detalles.forEach((det: any) => {
          const prod = det.producto;
          if (prod) {
            if (!inventarioMap.has(prod.id)) {
              inventarioMap.set(prod.id, {
                SKU: prod.codigo || `SKU-${prod.id}`,
                Producto: prod.nombre,
                Categoría: prod.categoria?.nombre || 'General',
                'Precio Venta (S/)': prod.precio,
                'Unidades Vendidas': 0, // Lo calcularemos
                'Stock Actual': prod.stock,
                Estado: prod.stock > 10 ? 'Activo' : prod.stock > 0 ? 'Stock Bajo' : 'Sin Stock',
              });
            }
            // Sumamos las unidades vendidas históricamente
            inventarioMap.get(prod.id)['Unidades Vendidas'] += det.cantidad;
          }
        });
      }
    });

    return Array.from(inventarioMap.values());
  }

  // 3. Reporte de Pedidos de Mostrador / Retiros (Real)
  private getOrdersPickupData(): any[] {
    // Filtramos solo las órdenes que no fueron compras directas en el POS físico
    const pedidosWeb = this.realOrders().filter((o) => o.canal !== 'Tienda (POS)');

    return pedidosWeb.map((o) => {
      const d = new Date(o.fechaRegistro || new Date());
      const numSerie = `ORD-${o.id.toString().padStart(6, '0')}`;

      return {
        'N° Pedido': numSerie,
        Cliente: o.usuario?.nombreCompleto || o.usuario?.email || 'Cliente Web',
        'Fecha Compra': d.toLocaleDateString('es-PE'),
        Comprobante: o.tipoComprobante || 'Boleta',
        'Método Pago': o.metodoPago || 'Pasarela',
        'Estado de Entrega': o.estado || 'PENDIENTE',
        'Total (S/)': o.total || 0,
      };
    });
  }

  // 4. Reporte de Clientes Reales (Basado en compras)
  private getClientsData(): any[] {
    const clientesMap = new Map<string, any>();

    this.realOrders().forEach((orden) => {
      // Usamos el email o el nombre como identificador único del cliente
      const clienteId = orden.usuario?.email || orden.nombreCliente || 'Cliente Anónimo';

      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          Cliente: orden.nombreCliente || orden.usuario?.nombreCompleto || 'Sin Nombre',
          'Email/Contacto': orden.usuario?.email || 'No registrado',
          Documento: orden.documentoCliente || orden.usuario?.dni || 'S/D',
          'Pedidos Totales': 0,
          'Total Comprado (S/)': 0,
          Tipo: 'Regular', // Lo actualizaremos
        });
      }

      // Sumarizamos su historial
      const infoCliente = clientesMap.get(clienteId);
      infoCliente['Pedidos Totales'] += 1;
      infoCliente['Total Comprado (S/)'] += orden.total || 0;

      // Lógica simple para definir si es "Frecuente"
      infoCliente['Tipo'] = infoCliente['Pedidos Totales'] >= 3 ? 'Frecuente' : 'Regular';
    });

    // Convertir a array y ordenar por los mejores clientes
    const clientesArray = Array.from(clientesMap.values());
    clientesArray.sort((a, b) => b['Total Comprado (S/)'] - a['Total Comprado (S/)']);

    return clientesArray;
  }

  triggerToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);

    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
