import { Component } from '@angular/core';

import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class FooterComponent {
  constructor(private router: Router) {}

  goInfo(routePath: string): void {
    this.router.navigate([routePath]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goCategory(category: string): void {
    this.router.navigate(['/catalog'], { queryParams: { category } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
