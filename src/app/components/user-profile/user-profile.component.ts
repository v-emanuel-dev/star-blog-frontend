import { HttpHeaders } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { UserService } from './../../services/user.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  userId: string | null = null;
  username: string = '';
  email: string | null = null;
  password: string = '';
  confirmPassword: string = '';
  role: string | null = null;
  selectedImage: File | null = null;
  selectedImagePreview: SafeUrl | null = null;
  profilePicture: string | null = null;
  defaultPicture: string =
    'http://localhost:4200/assets/img/default-profile.png';
  isAdmin: boolean = false;
  loading: boolean = false;

  private userDetailsSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private imageService: ImageService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userDetailsSubscription = this.authService.userDetails$.subscribe(
      (details) => {
        if (details) {
          this.updateUserData(details);
          this.role = details.role;
          this.isAdmin = this.role === 'admin';
          this.cd.detectChanges();
        } else {
          this.snackbar('User details are null while loading user data.');
        }
      }
    );

    this.loadUserData();
    this.subscribeToImageUpdates();
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  private loadUserData(): void {
    this.loading = true;

    this.userDetailsSubscription = this.authService.userDetails$.subscribe(
      (details) => {
        if (details) {
          this.updateUserData(details);
          this.loading = false;
        } else {
          this.loading = false;
        }
      }
    );
  }

  private updateUserData(user: User): void {
    this.username = user.username || '';
    this.email = user.email || '';
    this.role = user.role || 'user';
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
      return;
    }

    this.loading = true;

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
          this.handleUserUpdateSuccess(response);
          this.loading = false;
          if (response.profilePicture) {
            const formattedProfilePic = response.profilePicture.replace(
              /\\/g,
              '/'
            );
            this.imageService.updateProfilePic(formattedProfilePic);
          }
        },
        (error) => {
          this.handleUserUpdateError(error);
          this.loading = false;
        }
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
    this.snackbar('User updated successfully!');
    if (response.profilePicture) {
      const formattedUrl = response.profilePicture.replace(/\\/g, '/');
      this.profilePicture = formattedUrl;
      this.userService.updateProfilePicture(this.profilePicture);
    }

    // Atualiza o BehaviorSubject com os novos dados do usuário
    // Atualiza o BehaviorSubject com os novos dados do usuário
    const updatedUser = {
      ...response,
      role: this.role,
      username: this.username,
      email: this.email,
      profilePicture: this.profilePicture,
    };
    this.authService.updateUserDetails(updatedUser); // Certifique-se de ter este método no AuthService

    this.selectedImage = null;
  }

  private handleUserUpdateError(error: any): void {
    this.snackbar(error.error.message || 'Error updating user');
  }

  private setMessage(message: string): void {
    this.snackbar(message);
  }

  ngOnDestroy(): void {
    this.userDetailsSubscription.unsubscribe();
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar',
    });
  }
}
