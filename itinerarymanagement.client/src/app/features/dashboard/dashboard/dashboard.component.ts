import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreatePlanComponent } from '../create-plan/create-plan.component';
import { Project, ProjectDTO } from '../../../models/project/project.model';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/common/notification.service';
import { firstValueFrom } from 'rxjs';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    imports: [MatIconButton, MatTooltip, MatIcon, MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatMenuTrigger, MatMenu, MatMenuItem, DatePipe, TranslatePipe]
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  projects: Project[] = [];
  projectsListVisible = true;


  ngOnInit(): void {
    this.loadProjects();
  }

  public async loadProjects(): Promise<void> {
    try {
      const projects = await firstValueFrom(this.dashboardService.getAllProjects());
      this.projects = projects;
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }

  public async addProject(): Promise<void> {
    const dialogRef = this.dialog.open(CreatePlanComponent, {
      width: '600px'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) return;

    const { destination, startDate, endDate } = result;

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const newProject: ProjectDTO = {
      title: destination,
      startDate: new Date(startDateObj.getTime() - startDateObj.getTimezoneOffset() * 60000),
      endDate: new Date(endDateObj.getTime() - endDateObj.getTimezoneOffset() * 60000)
    };

    try {
      const added_project = await firstValueFrom(this.dashboardService.addProject(newProject));
      this.notificationService.showNotification('Projekt byl úspěšně vytvořen');
      this.openProject(added_project);
    } catch {
      this.notificationService.showNotification('Nepovedlo vytvořit projekt', 'error');
    }
  }


  public openProject(project: Project) {
    this.router.navigate(['/dashboard/project/', project.id]);
  }

  public async editProject(project: Project): Promise<void> {
    const dialogRef = this.dialog.open(CreatePlanComponent, {
      width: '600px',
      data: project,
      autoFocus: false
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) return;

    const originalTitle = project.title;
    const originalStartDate = project.startDate;
    const originalEndDate = project.endDate;

    const startDate = new Date(result.startDate);
    const endDate = new Date(result.endDate);

    project.title = result.destination;
    project.startDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
    project.endDate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);

    try {
      await firstValueFrom(this.dashboardService.updateProject(project));
      this.loadProjects();
      this.notificationService.showNotification('Projekt byl úspěšně upraven!');
    } catch (err) {
      project.title = originalTitle;
      project.startDate = originalStartDate;
      project.endDate = originalEndDate;
      console.error('Chyba při úpravě projektu:', err);
      this.notificationService.showNotification('Nastala chyba při úpravě projektu!', 'error');
    }
  }

  public async deleteProject(project: Project): Promise<void> {
    try {
      await firstValueFrom(this.dashboardService.deleteProject(project.id));

      this.projects = this.projects.filter(p => p.id !== project.id);
      this.notificationService.showNotification('Projekt byl úspěšně odstraněn!');
    } catch (err) {
      console.error('Chyba při odstraňování projektu:', err);
      this.notificationService.showNotification('Nastala chyba při odstraňování projektu. Zkuste to prosím znovu', 'error');
    }
  }

  toggleProjectsList(): void {
    this.projectsListVisible = !this.projectsListVisible;
  }
}
