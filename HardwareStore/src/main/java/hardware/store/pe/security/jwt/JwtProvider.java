package hardware.store.pe.security.jwt;

import hardware.store.pe.models.Usuario;
import hardware.store.pe.models.UsuarioPrincipal;
import hardware.store.pe.repositories.UsuarioRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtProvider {

    private final static Logger logger = LoggerFactory.getLogger(JwtProvider.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private int expiration;

    private final UsuarioRepository usuarioRepository;

    // Método para obtener la clave secreta con la nueva interfaz SecretKey
    private SecretKey getSecretKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // 1. GENERA EL TOKEN (Sintaxis actualizada con Roles)
    public String generateToken(Authentication authentication) {
        UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();

        // 1. Buscamos el usuario completo en la BD para obtener su ID y apellido
        Usuario usuario = usuarioRepository.findByEmail(usuarioPrincipal.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado al generar token"));

        List<String> roles = usuarioPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(usuarioPrincipal.getUsername())
                .claim("roles", roles)
                // NUEVOS CLAIMS: ID y Nombre Completo
                .claim("id", usuario.getId())
                .claim("nombreCompleto", usuario.getNombre() + " " + usuario.getApellido())
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + expiration * 1000L))
                .signWith(getSecretKey())
                .compact();
    }

    // 2. EXTRAE EL EMAIL DEL TOKEN (Sintaxis actualizada)
    public String getNombreUsuarioFromToken(String token) {
        return Jwts.parser()                             // Ya no es parserBuilder()
                .verifyWith(getSecretKey())              // Ya no es setSigningKey()
                .build()
                .parseSignedClaims(token)                // Ya no es parseClaimsJws()
                .getPayload()                            // Ya no es getBody()
                .getSubject();
    }

    // 3. VALIDA QUE EL TOKEN SEA AUTÉNTICO (Sintaxis actualizada)
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Token mal formado: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Token no soportado: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("Token expirado: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Token vacío: " + e.getMessage());
        } catch (SignatureException e) {
            logger.error("Fallo en la firma digital: " + e.getMessage());
        }
        return false;
    }
}
