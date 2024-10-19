import { UserService } from './../../services/user.service';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgForm } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit {
  username: string = '';
  email: string | null = null;
  password: string = '';
  confirmPassword: string = '';
  role: string | null = null; // Permite que role seja string ou null
  message: string | null = null;
  success: boolean | undefined;
  selectedImage: File | null = null;
  selectedImagePreview: SafeUrl | null = null;
  profilePicture: string | null = null;
  defaultPicture: string = 'assets/img/default-profile.png'; // Substitua pela URL da imagem padrão
  isAdmin: boolean = false; // Flag para verificar se o usuário é admin

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private imageService: ImageService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.imageService.profilePic$.subscribe((pic) => {
      this.profilePicture = pic || this.defaultPicture;
      this.cd.detectChanges();
    });
    this.authService.getUserRole().subscribe(role => {
      this.role = role;
      this.isAdmin = (role === 'admin'); // Verifica se o usuário é admin
    });
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  onImageError() {
    this.profilePicture = this.defaultPicture;
  }

  loadUserData(): void {
    const userId = this.authService.getUserId();
    if (userId !== null) {
      this.userService.getUserById(userId).subscribe(
        (user) => {
          this.username = user.username || '';
          this.email = user.email || '';
          this.role || 'user', // Use 'user' como valor padrão se role for null
          'User data loaded:', user;
          const profilePictureUrl = this.imageService.getFullProfilePicUrl(user.profilePicture || '');
          this.imageService.updateProfilePic(profilePictureUrl);
        }
      );
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImage = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  updateUser(form: NgForm) {
    if (form.invalid) {
      this.message = 'Please fill in all fields correctly.';
      this.success = false;
      return;
    }

    if (this.password && this.password !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      this.success = false;
      return;
    }

    const userId = localStorage.getItem('userId');
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (userId === null) {
      this.message = 'User ID not found.';
      this.success = false;
      return;
    }

    this.userService
      .updateUser(
        String(userId),
        this.username,
        this.email ?? '',
        this.password || '',
        this.selectedImage,
        this.role || 'user', // Use 'user' como valor padrão se role for null
        headers
      )
      .subscribe(
        (response) => {
          this.message = 'User updated successfully';
          this.success = true;
          this.loadUserData();

          if (this.selectedImage) {
            const imageUrl = URL.createObjectURL(this.selectedImage);
            this.userService.updateProfilePicture(imageUrl);
          }

          this.selectedImage = null;
          setTimeout(() => {
            this.router.navigate(['/blog']); // Redireciona para o dashboard após 2 segundos
          }, 1500);
        },
        (error) => {
          console.error('Error updating user', error);
          this.message = error.error.message || 'Error updating user';
          this.success = false;
        }
      );
  }
}
