import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = 'user'; // Defina um valor padrão para a role, como 'user'
  message: string | null = null; // Mensagem a ser exibida
  success: boolean = false;
  loading: boolean = false; // Loading state
  isAdmin: boolean = false; // Para verificar se o usuário é admin

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Verifique se o usuário é admin
    this.authService.getUserRole().subscribe(role => {
      this.isAdmin = (role === 'admin');
      console.log('User role:', role);
    });
  }

  // Método para lidar com o registro
  register(form: NgForm) {
    console.log('Register method called. Form validity:', form.valid);

    if (form.invalid) {
      this.message = 'Please fill in all fields correctly.';
      this.success = false;
      console.warn('Form is invalid. Message:', this.message);
      return;
    }

    // Verifique se as senhas coincidem
    if (this.password !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      this.success = false;
      console.warn('Password mismatch. Message:', this.message);
      return;
    }

    this.loading = true;
    console.log('Loading state set to true. Initiating registration...');

    this.authService.register(this.email, this.username, this.password, this.role).subscribe(
      response => {
        console.log('Registration response received:', response);
        this.message = 'Registration successful! Please log in.';
        this.success = true;
        form.reset();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error => {
        this.message = error.error.message || 'Registration failed. Please try again.';
        this.success = false;
        console.error('Registration error occurred:', error);
      },
      () => {
        this.loading = false;
        console.log('Loading state set to false. Registration process completed.');
      }
    );
  }
}
