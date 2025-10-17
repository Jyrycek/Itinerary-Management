import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { NotificationService } from '../../core/services/common/notification.service';
import { FileUploadService } from '../../core/services/common/file-upload.service';
import { firstValueFrom } from 'rxjs';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { UserService } from '../../core/services/user.service';
import { UserJson } from '../../models/user/user';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { ProfileDatePipe } from '../../shared/pipes/profile-date.pipe';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatIcon, MatCardTitle, MatCardSubtitle, MatIconButton, MatMenuTrigger, MatMenu, MatMenuItem, MatCardContent, ProfileDatePipe]
})
export class ProfileComponent implements OnInit {
  private readonly fileUploadService = inject(FileUploadService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  user: UserJson = new UserJson();

  async ngOnInit(): Promise<void> {
    try {
      this.user = await firstValueFrom(this.userService.requestUser());
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }

  public async onFileChange(event: any) {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;
    if (!this.fileUploadService.validateFile(selectedFile)) return;

    try {
      await firstValueFrom(this.userService.uploadUserProfileImage(selectedFile));
      this.notificationService.showNotification('Profilový obrázek byl úspěšně změněn');

      const user = await firstValueFrom(this.userService.requestUser());
      this.user = user;
      this.updateUserProfileData(user);
    } catch (err) {
      this.notificationService.showNotification('Nastala chyba při změně profilového obrázku', 'error');
      console.error('Error uploading image', err);
    }
  }

  public async openEditDialog(): Promise<void> {
    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: '400px',
      data: this.user,
    });

    try {
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (!result) return;

      this.user.email = result.email;
      this.user.firstName = result.firstName;
      this.user.lastName = result.lastName;

      await firstValueFrom(this.userService.updateUser(this.user));
      this.updateUserProfileData(this.user);

      this.notificationService.showNotification('Profil byl úspěšně upraven');

    } catch (err) {
      this.notificationService.showNotification('Nastala chyba při změně úprave profilu', 'error');
      console.error('Error updating user', err);
    }
  }

  public async openChangePasswordDialog() {
    const dialogRef = this.dialog.open(ChangePasswordComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(success => {
      if (success) {
        this.notificationService.showNotification('Heslo bylo úspěšně změněno');
      }
    });
  }

  public updateUserProfileData(user: UserJson) {
    this.userService.updateUserProfile(user);
  }
}
