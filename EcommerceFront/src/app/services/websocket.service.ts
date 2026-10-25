import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private stompClient: Client;
  public ordenUpdates$ = new Subject<any>();

  constructor() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-ferreteria',
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP: ' + str),
    });

    this.stompClient.onConnect = () => {
      console.log('Conectado de forma NATIVA al servidor de WebSockets');
    };

    this.stompClient.activate();
  }

  public suscribirAOrden(ordenId: number) {
    if (this.stompClient.connected) {
      // Se suscribe exactamente al canal de la orden que el cliente está mirando
      this.stompClient.subscribe(`/topic/ordenes/${ordenId}`, (mensaje: Message) => {
        if (mensaje.body) {
          const ordenActualizada = JSON.parse(mensaje.body);
          this.ordenUpdates$.next(ordenActualizada); // Envía el JSON al componente
        }
      });
    } else {
      // Si la conexión aún está cargando, reintenta en un segundo
      setTimeout(() => this.suscribirAOrden(ordenId), 1000);
    }
  }
}
