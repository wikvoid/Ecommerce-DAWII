import { Component, inject, OnInit } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent implements OnInit {
  showPass = false;
  showConfirmPass = false;
  loading = false;
  error = '';
  success = '';

  registerForm!: FormGroup;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        fullName: ['', Validators.required],
        dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]], // Validación de 8 números
        email: ['', [Validators.required, Validators.email]],
        phone: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPass: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  // Validador personalizado para asegurar que las contraseñas coinciden
  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPass = control.get('confirmPass')?.value;
    return password === confirmPass ? null : { passwordsMismatch: true };
  }

  toggleShowPass(): void {
    this.showPass = !this.showPass;
  }
  toggleShowConfirmPass(): void {
    this.showConfirmPass = !this.showConfirmPass;
  }
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.error = 'Por favor, completa los campos requeridos correctamente.';
      return;
    }

    this.loading = true;
    this.error = '';

    // Truco: Separar el "Nombre Completo" en "Nombre" y "Apellido" para el Backend
    const full = this.registerForm.get('fullName')?.value.trim();
    const spaceIndex = full.indexOf(' ');
    const nombre = spaceIndex === -1 ? full : full.substring(0, spaceIndex);
    const apellido = spaceIndex === -1 ? '' : full.substring(spaceIndex + 1);

    // Armamos el JSON tal cual lo pide tu Spring Boot
    const nuevoUsuario = {
      nombre: nombre,
      apellido: apellido,
      dni: this.registerForm.get('dni')?.value,
      telefono: this.registerForm.get('phone')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value,
    };

    this.authService.registro(nuevoUsuario).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Cuenta creada exitosamente. Redirigiendo...';
        // Redirección automática después de 2 segundos sin usar alerts
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al registrar. Intenta con otro correo o DNI.';
      },
    });
  }
}
