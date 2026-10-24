package hardware.store.pe.repositories;

import hardware.store.pe.models.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    // 1. Catálogo general: Solo productos activos (que no han sido dados de baja)
    List<Producto> findByActivoTrue();

    // 2. Filtro por categoría: Cuando el cliente hace clic en "Herramientas"
    List<Producto> findByCategoriaIdAndActivoTrue(Integer categoriaId);

    // 3. Barra de búsqueda: Busca coincidencias en el nombre ignorando mayúsculas/minúsculas
    // Se traduce a SQL como: SELECT * FROM productos WHERE nombre ILIKE '%término%' AND activo = true
    List<Producto> findByNombreContainingIgnoreCaseAndActivoTrue(String termino);
}
