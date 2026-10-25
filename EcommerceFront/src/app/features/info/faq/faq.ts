import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { CartService } from '../../../core/services/cart.service';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  cat: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './faq.html',
  styleUrls: ['./faq.css'],
})
export class FaqComponent {
  openItemKey: string | null = null;

  faqSections: FaqSection[] = [
    {
      cat: '🛒 Compras',
      items: [
        {
          q: '¿Necesito crear una cuenta para comprar?',
          a: 'Sí, es necesario iniciar sesión o registrarte para completar una compra. Puedes explorar todo el catálogo libremente, pero para confirmar tu pedido con recojo en tienda te solicitaremos tus datos para coordinar la entrega y emitir tu comprobante.',
        },
        {
          q: '¿Cómo sé si un producto tiene stock?',
          a: 'En la ficha de cada producto figura el indicador "EN STOCK" en tiempo real. Los productos sin existencias quedan marcados como "SIN STOCK" para evitar inconvenientes.',
        },
        {
          q: '¿Puedo modificar o cancelar un pedido?',
          a: 'Podés solicitar modificaciones o cancelaciones comunicándote a nuestro WhatsApp o llamando al teléfono de atención antes de que el pedido sea preparado en mostrador.',
        },
        {
          q: '¿Ofrecen descuentos para compras en cantidad?',
          a: 'Sí. Si necesitás materiales por volumen para obra o contratistas, podés comunicarte con nuestro equipo comercial para acceder a listas de precios mayoristas.',
        },
      ],
    },
    {
      cat: '🏬 Recojo en tienda',
      items: [
        {
          q: '¿El recojo en tienda tiene algún costo?',
          a: 'El recojo es 100% gratuito. No cobramos ningún cargo adicional por preparar y almacenar tu compra.',
        },
        {
          q: '¿En cuánto tiempo está listo mi pedido para retirar?',
          a: 'Si realizás tu compra antes de las 4:00 p.m., preparamos y empaquetamos tus productos en menos de 2 horas hábiles para retiro el mismo día.',
        },
        {
          q: '¿Qué documentos debo presentar en mostrador?',
          a: 'Solo necesitás presentar tu DNI o documento de identidad físico y el número o código de pedido que recibís al completar la orden.',
        },
        {
          q: '¿Puede retirar otra persona en mi lugar?',
          a: 'Sí, siempre que indiques el nombre y documento de la persona autorizada en las notas de tu pedido o nos avises por WhatsApp adjuntando la orden.',
        },
      ],
    },
    {
      cat: '💳 Pagos y comprobantes',
      items: [
        {
          q: '¿Qué medios de pago aceptan?',
          a: 'Aceptamos tarjetas de crédito y débito.',
        },
        {
          q: '¿Puedo solicitar factura electrónica?',
          a: 'Sí. Emitimos factura y boleta electrónica. Solo debés dejar tu RUC y razón social en el campo de notas al tramitar tu carrito.',
        },
        {
          q: '¿Es seguro pagar en su sitio web?',
          a: 'Absolutamente. Todas las transacciones se gestionan bajo pasarelas seguras con cifrado SSL de 256 bits, garantizando la privacidad de tus datos financieros.',
        },
      ],
    },
    {
      cat: '↩️ Cambios y devoluciones',
      items: [
        {
          q: '¿Cuál es el plazo para solicitar un cambio?',
          a: 'Contás con hasta 30 días calendario desde el momento del recojo para gestionar cambios por otro producto o solicitar garantía oficial de fábrica.',
        },
        {
          q: '¿Cuáles son las condiciones para aceptar una devolución?',
          a: 'El producto debe encontrarse sin señales de uso, con todos sus accesorios, manuales y en su caja o empaque original en buen estado.',
        },
        {
          q: '¿Cómo inicio el trámite de garantía o cambio?',
          a: 'Acercate con el producto y tu comprobante de compra directamente al mostrador de nuestra tienda o escribinos a devoluciones@ferremas.com.ar.',
        },
      ],
    },
  ];

  constructor(
    public cartService: CartService,
    private router: Router,
  ) {}

  toggleItem(key: string): void {
    this.openItemKey = this.openItemKey === key ? null : key;
  }

  isOpen(key: string): boolean {
    return this.openItemKey === key;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
