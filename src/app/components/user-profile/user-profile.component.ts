import { UserService } from './../../services/user.service';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy, // Importa OnDestroy para a interface
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgForm } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageService } from '../../services/image.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  // Implementa OnDestroy
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
  defaultPicture: string =
    'https://star-blog-frontend-git-main-vemanueldevs-projects.vercel.app/assets/img/default-profile.png'; // URL da imagem padrão
  isAdmin: boolean = false; // Flag para verificar se o usuário é admin

  private roleSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private imageService: ImageService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscrição à observable do papel do usuário
    this.roleSubscription = this.authService.userRole$.subscribe((role) => {
      this.role = role; // Atualiza a role diretamente
      this.isAdmin = role === 'admin'; // Define se é admin
      this.cd.detectChanges(); // Força atualização da view, se necessário
    });

    this.loadUserData();
    this.subscribeToImageUpdates();
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
    this.role = user.role ?? 'user'; // Define o valor padrão como 'user'

    this.isAdmin = this.role === 'admin';
  }

  private subscribeToImageUpdates(): void {
    this.imageService.profilePic$.subscribe((pic) => {
      this.profilePicture = pic || this.defaultPicture;
      this.cd.detectChanges();
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
      console.warn('User ID not found in localStorage.');
      return;
    }

    console.log('Initiating user update with ID:', userId);
    console.log('User update payload:', {
      username: this.username,
      email: this.email,
      password: this.password ? 'Provided' : 'Not provided',
      role: this.role || 'user',
    });

    this.userService
      .updateUser(
        String(userId),
        this.username,
        this.email ?? '',
        this.password || '',
        this.selectedImage,
        this.role || 'user',
        headers
      )
      .subscribe(
        (response) => {
          console.log('User update request successful. Handling response...');
          this.handleUserUpdateSuccess(response);
          // Chamada para atualizar a imagem de perfil se a resposta contiver a URL da imagem
          if (response.profilePicture) {
            // Formata a URL da imagem antes de passar ao ImageService
            const formattedProfilePic = response.profilePicture.replace(
              /\\/g,
              '/'
            );
            this.imageService.updateProfilePic(formattedProfilePic);
          }
        },
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
    this.message = 'User updated successfully!';
    this.success = true;

    // Verifica e formata a URL da imagem de perfil
    if (response.profilePicture) {
      let formattedUrl = response.profilePicture.replace(/\\/g, '/');
      console.log('Formatted profile picture URL:', formattedUrl);

      // Atualiza a imagem no UserService e armazena a URL formatada no localStorage
      this.profilePicture = formattedUrl;
      this.userService.updateProfilePicture(this.profilePicture);
      console.log('Profile picture updated in UserService.');
    }

    // Recarrega os dados do usuário e limpa a imagem selecionada
    this.loadUserData();
    this.selectedImage = null;
    console.log('User data reloaded and selected image cleared.');
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

  ngOnDestroy(): void {
    // Desinscreve-se da observável quando o componente é destruído
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }
}
