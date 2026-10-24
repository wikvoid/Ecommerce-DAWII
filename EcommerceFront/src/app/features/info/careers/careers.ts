import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CartService } from '../../../core/services/cart.service';

interface Benefit {
  icon: string;
  title: string;
  desc: string;
}

interface Position {
  title: string;
  area: string;
  type: string;
  loc: string;
  desc: string;
}

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './careers.html',
  styleUrls: ['./careers.css'],
})
export class CareersComponent {
  benefits: Benefit[] = [
    {
      icon: '📈',
      title: 'Crecimiento real',
      desc: 'El 70% de nuestros supervisores empezaron en posiciones base. Apostamos al talento interno y plan de carrera.',
    },
    {
      icon: '🏥',
      title: 'Seguro médico',
      desc: 'Cobertura de salud completa para vos y tu familia desde el primer día de contratación.',
    },
    {
      icon: '🍽️',
      title: 'Comedor y refrigerio',
      desc: 'Almuerzo cubierto al 100% en todas nuestras sedes y locales comerciales.',
    },
    {
      icon: '🎓',
      title: 'Capacitación constante',
      desc: 'Talleres técnicos con marcas líderes (Bosch, Stanley, Makita) y cursos en atención al cliente.',
    },
    {
      icon: '⏰',
      title: 'Horarios estables',
      desc: 'Turnos fijos y balance vida-trabajo con descansos puntuales.',
    },
    {
      icon: '🎁',
      title: 'Beneficios y descuentos',
      desc: 'Descuento especial del 20% en todas las compras de herramientas y materiales en tienda.',
    },
  ];

  positions: Position[] = [
    {
      title: 'Asesor/a de Ventas en Mostrador',
      area: 'Comercial',
      type: 'Full-time',
      loc: 'Tienda Almagro',
      desc: 'Atención presencial a clientes, orientación en herramientas manuales, eléctricas y materiales para obra.',
    },
    {
      title: 'Operario/a de Almacén y Despacho',
      area: 'Logística',
      type: 'Full-time',
      loc: 'Almacén Central',
      desc: 'Recepción de mercadería, control de inventario y preparación de pedidos para retiro en mostrador.',
    },
    {
      title: 'Cajero/a Comercial',
      area: 'Administración',
      type: 'Full-time',
      loc: 'Tienda Almagro',
      desc: 'Facturación de comprobantes (boletas/facturas), cobro en pasarelas POS y cuadre de caja diario.',
    },
    {
      title: 'Asesor/a Técnico en Pinturas y Revestimientos',
      area: 'Especialistas',
      type: 'Part-time',
      loc: 'Tienda Almagro',
      desc: 'Preparación de mezclas de color, asesoría técnica en látex, esmaltes e impermeabilizantes.',
    },
  ];

  constructor(
    public cartService: CartService,
    private router: Router,
  ) {}

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
