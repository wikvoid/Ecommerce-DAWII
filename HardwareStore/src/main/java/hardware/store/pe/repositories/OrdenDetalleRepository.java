package hardware.store.pe.repositories;

import hardware.store.pe.models.OrdenDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdenDetalleRepository extends JpaRepository<OrdenDetalle, Integer> {

    // Si en algún momento necesitas buscar los detalles sabiendo solo el ID de la orden
    List<OrdenDetalle> findByOrdenId(Integer ordenId);
}
