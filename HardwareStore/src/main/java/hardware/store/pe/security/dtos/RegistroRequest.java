package hardware.store.pe.security.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RegistroRequest {
    @NotBlank private String nombre;
    @NotBlank private String apellido;
    @NotBlank private String dni;
    private String telefono; // Opcional

    @NotBlank @Email private String email;
    @NotBlank private String password;
}
