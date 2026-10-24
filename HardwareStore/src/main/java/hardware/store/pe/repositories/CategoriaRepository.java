package hardware.store.pe.repositories;

import hardware.store.pe.models.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    // Trae todas las categorías cuyo campo 'activo' sea true
    List<Categoria> findByActivoTrue();

    // Útil para validar que no creen dos categorías con el mismo nombre
    boolean existsByNombreIgnoreCase(String nombre);
}
