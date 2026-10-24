import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.css'],
})
export class PaginationComponent {
  // Recibe datos desde el Catálogo
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  // Emite un evento hacia el Catálogo cuando el usuario hace clic
  @Output() pageChange = new EventEmitter<number>();

  // Genera el arreglo de números [1, 2, 3...] para pintar los puntitos
  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Mét.odo que dispara el HTML al hacer clic en un número o flecha
  selectPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
