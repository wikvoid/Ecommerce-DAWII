package hardware.store.pe.repositories;

import hardware.store.pe.models.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdenRepository extends JpaRepository<Orden, Integer> {

    // Para el perfil del CLIENTE: Trae todas sus órdenes, ordenadas de la más reciente a la más antigua
    List<Orden> findByUsuarioIdOrderByFechaOrdenDesc(Integer usuarioId);

    // Para el perfil del VENDEDOR: Trae los pedidos filtrando por estado (ej. "PENDIENTE")
    // ordenados desde el más antiguo al más nuevo para despachar por orden de llegada
    List<Orden> findByEstadoOrderByFechaOrdenAsc(String estado);
}
