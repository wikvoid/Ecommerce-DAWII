import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-sobre-nosotros',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './about_us.html',
  styleUrls: ['./about_us.css'],
})
export class AboutUsComponent {
  stats = [
    { val: '+5.000', label: 'Productos en stock', icon: '📦' },
    { val: '48', label: 'Personas en el equipo', icon: '👥' },
    { val: '+80.000', label: 'Clientes satisfechos', icon: '⭐' },
    { val: '15 años', label: 'De experiencia', icon: '🏆' },
  ];

  valores = [
    {
      icon: '🤝',
      title: 'Honestidad',
      desc: 'No vendemos lo que no necesitás. Te asesoramos para que elijas el producto correcto, aunque sea el más económico.',
    },
    {
      icon: '🔩',
      title: 'Calidad',
      desc: 'Solo trabajamos con marcas certificadas. Cada producto que vendemos pasa por nuestro control antes de llegar a vos.',
    },
    {
      icon: '⚡',
      title: 'Agilidad',
      desc: 'Entendemos que la obra no puede esperar. Por eso tenemos el mejor stock y retiro inmediato en tienda.',
    },
  ];

  equipo = [
    {
      name: 'Carlos Fernández',
      role: 'Fundador y CEO',
      img: 'photo-1472099645785-5658abf4ff4e',
    },
    {
      name: 'Luciana Torres',
      role: 'Gerente Comercial',
      img: 'photo-1494790108377-be9c29b29330',
    },
    {
      name: 'Martín Ríos',
      role: 'Jefe de Logística',
      img: 'photo-1500648767791-00dcc994a43e',
    },
  ];

  constructor(
    public cartService: CartService,
    private router: Router,
  ) {}

  goCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
