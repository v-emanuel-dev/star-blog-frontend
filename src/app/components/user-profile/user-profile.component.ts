import { UserService } from './../../services/user.service';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
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
    this.authService.getUserRole().subscribe((role) => {
      this.role = role;
      this.isAdmin = role === 'admin'; // Verifica se o usuário é admin
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
    console.log('Loading user data for ID:', userId);

    if (userId !== null) {
      this.userService.getUserById(userId).subscribe((user) => {
        this.username = user.username || '';
        this.email = user.email || '';
        this.role = user.role || 'user';

        // Verifique se a imagem de perfil é nula e, se assim for, use a imagem padrão
        const profilePictureUrl = user.profilePicture
          ? this.imageService.getFullProfilePicUrl(user.profilePicture)
          : 'https://star-blog-frontend-git-main-vemanueldevs-projects.vercel.app/assets/img/default-profile.png'; // Imagem padrão

        this.imageService.updateProfilePic(profilePictureUrl);
        this.profilePicture = profilePictureUrl; // Defina a imagem do perfil
      });
    } else {
      console.warn('User ID is null while loading user data.');
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
      console.warn('Form is invalid. Message:', this.message);
      return;
    }

    if (this.password && this.password !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      this.success = false;
      console.warn('Passwords do not match.');
      return;
    }

    const userId = localStorage.getItem('userId');
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (userId === null) {
      this.message = 'User ID not found.';
      this.success = false;
      console.warn(this.message);
      return;
    }

    console.log('Updating user with ID:', userId);
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
          console.log('User updated successfully. Response:', response);
          this.loadUserData();

          if (this.selectedImage) {
            const imageUrl = URL.createObjectURL(this.selectedImage);
            console.log('Creating object URL for selected image:', imageUrl);
            this.userService.updateProfilePicture(imageUrl);
          }

          this.selectedImage = null;
          setTimeout(() => {
            this.router.navigate(['/blog']); // Redireciona para o dashboard após 2 segundos
            console.log('Redirecting to /blog after user update.');
          }, 1500);
        },
        (error) => {
          console.error('Error updating user:', error);
          this.message = error.error.message || 'Error updating user';
          this.success = false;
        }
      );
  }
}
