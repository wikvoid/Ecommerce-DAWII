package hardware.store.pe.security.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
@AllArgsConstructor // Constructor automático con todos los campos
public class JwtResponse {
    private String token;
    private String bearer; // Siempre será "Bearer"
    private String email;
    private String nombre;
    private String apellido;
    private List<String> roles;
}
