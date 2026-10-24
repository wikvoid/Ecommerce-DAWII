package hardware.store.pe.repositories;

import hardware.store.pe.models.Rol;
import hardware.store.pe.models.RolNombre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RolRepository extends JpaRepository<Rol, Integer> {

    Optional<Rol> findByNombre(RolNombre nombre);
}
