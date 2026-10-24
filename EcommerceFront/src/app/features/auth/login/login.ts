import { Component, inject, OnInit, signal } from '@angular/core'; // <-- Importamos signal
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  circles = [140, 280, 440, 620, 820, 1040, 1280];
  stats = [
    { val: '+5.000', label: 'PRODUCTOS' },
    { val: '24h', label: 'ENTREGA' },
    { val: '15 años', label: 'EXPERIENCIA' },
  ];

  // Transformamos a Signals
  showPass = signal(false);
  loading = signal(false);
  error = signal('');

  loginForm!: FormGroup;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.tokenService.isLogged()) {
      this.router.navigate(['/catalog']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  toggleShowPass(): void {
    this.showPass.update((v) => !v);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  handleSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Usamos .set() para actualizar los valores
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: (data) => {
        this.tokenService.setToken(data.token);
        this.loading.set(false);
        this.router.navigate(['/catalog']);
      },
      error: (err) => {
        this.loading.set(false);

        const isTimeout = err && err.name === 'TimeoutError';
        const isServerDown = err && err.status === 0;

        if (isTimeout || isServerDown) {
          this.error.set('El servidor está apagado o no responde. Por favor, intenta más tarde.');
        } else {
          this.error.set(err?.error?.message || 'Correo o contraseña incorrectos.');
        }
      },
    });
  }
}
