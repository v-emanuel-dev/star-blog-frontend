import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  returnUrl: string | null = null;
  loading = false;
  profileImageUrl: string | null = null;
  googleLoginInProgress: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const storedImage = localStorage.getItem('profileImage');
    this.profileImageUrl = storedImage ? storedImage : null;

    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.snackbar(params['message']);
      }
    });

    this.profileImageUrl = this.authService.getProfileImageUrl();
  }

  login() {
    this.loading = true;

    if (this.googleLoginInProgress) {
      return;
    }

    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        localStorage.setItem('token', response.accessToken);
        this.snackbar('Login successful! Redirecting...');

        const userId = response.userId;

        this.userService.getUserById(userId).subscribe(
          (user) => {
            if (user.profilePicture) {
              this.authService.setProfileImageUrl(user.profilePicture);
            }
            this.loading = false;
            this.router.navigate(['/blog']);
          },
          (error) => {
            this.snackbar('Error fetching user data:');
            this.loading = false;
          }
        );
      },
      (error) => {
        if (!this.googleLoginInProgress) {
          this.snackbar('Login failed! Check your credentials.');
        }
        this.loading = false;
      }
    );
  }

  loginWithGoogle() {
    this.googleLoginInProgress = true;
    this.loading = true;
    window.open('https://blog-backend-production-c203.up.railway.app/api/auth/google', '_self');
  }

  logout() {
    this.authService.logout();
    localStorage.removeItem('token');
    this.authService.setProfileImageUrl('');
    this.profileImageUrl = null;
    this.router.navigate(['/login']);
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar',
    });
  }
}
