package hardware.store.pe.security.controllers;

import hardware.store.pe.models.Rol;
import hardware.store.pe.models.RolNombre;
import hardware.store.pe.models.Usuario;
import hardware.store.pe.models.UsuarioPrincipal;
import hardware.store.pe.repositories.RolRepository;
import hardware.store.pe.repositories.UsuarioRepository;
import hardware.store.pe.security.dtos.JwtResponse;
import hardware.store.pe.security.dtos.LoginRequest;
import hardware.store.pe.security.dtos.MensajeResponse;
import hardware.store.pe.security.dtos.RegistroRequest;
import hardware.store.pe.security.jwt.JwtProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    // ENDPOINT 1: REGISTRO DE NUEVO CLIENTE
    @PostMapping("/registro")
    public ResponseEntity<MensajeResponse> registrar(@Valid @RequestBody RegistroRequest req) {

        // 1. Validaciones de duplicados
        if (usuarioRepository.existsByEmail(req.getEmail())) {
            return new ResponseEntity<>(new MensajeResponse("El email ya está registrado"), HttpStatus.BAD_REQUEST);
        }
        if (usuarioRepository.existsByDni(req.getDni())) {
            return new ResponseEntity<>(new MensajeResponse("El DNI ya está registrado"), HttpStatus.BAD_REQUEST);
        }

        // 2. Crear el objeto Usuario (encriptando la contraseña)
        Usuario usuario = new Usuario(
                req.getNombre(),
                req.getApellido(),
                req.getDni(),
                req.getTelefono(),
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()) // ¡NUNCA GUARDAR EN TEXTO PLANO!
        );

        // 3. Asignar el rol por defecto (ROLE_CLIENTE)
        Set<Rol> roles = new HashSet<>();
        roles.add(rolRepository.findByNombre(RolNombre.ROLE_CLIENTE)
                .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado en la base de datos.")));
        usuario.setRoles(roles);

        // 4. Guardar en Supabase
        usuarioRepository.save(usuario);

        return new ResponseEntity<>(new MensajeResponse("Cuenta creada exitosamente"), HttpStatus.CREATED);
    }

    // ENDPOINT 2: INICIO DE SESIÓN
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest req) {

        // 1. Spring Security intenta autenticar con el email y contraseña
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );

        // 2. Establecemos la autenticación en el contexto
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Generamos el Token JWT
        String jwt = jwtProvider.generateToken(authentication);

        // 4. Extraemos los detalles del usuario para armar la respuesta
        UsuarioPrincipal userDetails = (UsuarioPrincipal) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // 5. Devolvemos el DTO con el Token y la información
        JwtResponse jwtResponse = new JwtResponse(
                jwt,
                "Bearer",
                userDetails.getUsername(),
                userDetails.getNombre(),
                "Usuario", // Aquí puedes ajustar para traer el apellido si lo necesitas en UsuarioPrincipal
                roles
        );

        return new ResponseEntity<>(jwtResponse, HttpStatus.OK);
    }
}
