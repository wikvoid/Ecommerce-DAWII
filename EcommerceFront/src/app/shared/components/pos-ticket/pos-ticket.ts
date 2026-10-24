import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pos-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pos-ticket.html',
  styleUrls: ['./pos-ticket.css'],
})
export class PosTicketComponent {
  @Input() sale: any = null;

  get ticketSubtotal(): number {
    return (this.sale?.total || 0) / 1.18;
  }

  get ticketIgv(): number {
    return (this.sale?.total || 0) - this.ticketSubtotal;
  }

  formatPrice(val: number): string {
    return (
      'S/ ' +
      (val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }
}
