package hardware.store.pe.models;

import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@AllArgsConstructor
public class UsuarioPrincipal implements UserDetails {

    private String nombre;
    private String email;
    private String password;
    private Boolean activo;
    private Collection<? extends GrantedAuthority> authorities;

    // Método estático que toma tu entidad Usuario y construye el UsuarioPrincipal
    public static UsuarioPrincipal build(Usuario usuario) {
        // Convertimos el Set<Rol> de tu base de datos a una lista de GrantedAuthority
        List<GrantedAuthority> authorities = usuario.getRoles().stream()
                .map(rol -> new SimpleGrantedAuthority(rol.getNombre().name()))
                .collect(Collectors.toList());

        return new UsuarioPrincipal(
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getPassword(),
                usuario.getActivo(),
                authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    // Spring Security usa "username" por defecto, pero nosotros usamos el email
    @Override
    public String getUsername() {
        return email;
    }

    public String getNombre() {
        return nombre;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // Usamos el campo "activo" de la base de datos para saber si el usuario puede loguearse
    @Override
    public boolean isEnabled() {
        return activo;
    }
}
