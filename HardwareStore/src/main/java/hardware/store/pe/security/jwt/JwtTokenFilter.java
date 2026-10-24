package hardware.store.pe.security.jwt;

import hardware.store.pe.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {

    private final static Logger logger = LoggerFactory.getLogger(JwtTokenFilter.class);

    private final JwtProvider jwtProvider;

    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Extraemos el token de la petición
            String token = getToken(request);

            // 2. Si hay token y es válido (no vencido, firma correcta, etc.)
            if (token != null && jwtProvider.validateToken(token)) {

                // 3. Obtenemos el email del usuario desde el token
                String email = jwtProvider.getNombreUsuarioFromToken(token);

                // 4. Buscamos al usuario en la base de datos para obtener sus roles
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // 5. Creamos el objeto de autenticación
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                // 6. Establecemos la autenticación en el contexto de seguridad de Spring
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            logger.error("Fallo en el método doFilterInternal: " + e.getMessage());
        }

        // 7. Le decimos a Spring que continúe con el flujo normal (ir al controlador)
        filterChain.doFilter(request, response);
    }

    // Método auxiliar para limpiar la cabecera HTTP y extraer solo el token
    private String getToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        // Angular enviará: "Authorization: Bearer eyJhbG..."
        if (header != null && header.startsWith("Bearer ")) {
            return header.replace("Bearer ", ""); // Quitamos la palabra "Bearer " para quedarnos solo con el JWT
        }
        return null;
    }
}
