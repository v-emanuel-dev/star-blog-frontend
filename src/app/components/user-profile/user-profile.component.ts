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
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, AfterViewInit {
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
  defaultPicture: string = 'assets/img/default-profile.png'; // URL da imagem padrão
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
    this.subscribeToImageUpdates();
    this.subscribeToUserRole();
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  private loadUserData(): void {
    const userId = this.authService.getUserId();
    if (userId !== null) {
      this.userService.getUserById(userId).subscribe((user) => {
        this.updateUserData(user);
      });
    } else {
      console.warn('User ID is null while loading user data.');
    }
  }

  private updateUserData(user: User): void {
    this.username = user.username || '';
    this.email = user.email || '';
    this.role = user.role || 'user';

    const profilePictureUrl = user.profilePicture
      ? this.imageService.getFullProfilePicUrl(user.profilePicture)
      : this.defaultPicture; // Imagem padrão

    this.imageService.updateProfilePic(profilePictureUrl);
    this.profilePicture = profilePictureUrl; // Defina a imagem do perfil
  }

  private subscribeToImageUpdates(): void {
    this.imageService.profilePic$.subscribe((pic) => {
      this.profilePicture = pic || this.defaultPicture;
      this.cd.detectChanges();
    });
  }

  private subscribeToUserRole(): void {
    this.authService.getUserRole().subscribe((role) => {
      this.role = role;
      this.isAdmin = role === 'admin'; // Verifica se o usuário é admin
    });
  }

  onImageError() {
    this.profilePicture = this.defaultPicture;
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
    if (this.isFormInvalid(form)) return;

    const userId = localStorage.getItem('userId');
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (userId === null) {
      this.setMessage('User ID not found.');
      return;
    }

    console.log('Updating user with ID:', userId);
    this.userService.updateUser(
      String(userId),
      this.username,
      this.email ?? '',
      this.password || '',
      this.selectedImage,
      this.role || 'user', // Use 'user' como valor padrão se role for null
      headers
    ).subscribe(
      (response) => this.handleUserUpdateSuccess(response),
      (error) => this.handleUserUpdateError(error)
    );
  }

  private isFormInvalid(form: NgForm): boolean {
    if (form.invalid) {
      this.setMessage('Please fill in all fields correctly.');
      return true;
    }

    if (this.password && this.password !== this.confirmPassword) {
      this.setMessage('Passwords do not match.');
      return true;
    }

    return false;
  }

  private handleUserUpdateSuccess(response: any): void {
    this.setMessage('User updated successfully');
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
  }

  private handleUserUpdateError(error: any): void {
    console.error('Error updating user:', error);
    this.setMessage(error.error.message || 'Error updating user');
  }

  private setMessage(message: string): void {
    this.message = message;
    this.success = false;
    console.warn(message);
  }
}
