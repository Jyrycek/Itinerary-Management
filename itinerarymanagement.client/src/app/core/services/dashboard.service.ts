import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Project, ProjectDTO } from '../../models/project/project.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl: string = environment.apiUrl + '/dashboard';
  private readonly http = inject(HttpClient);

  public updateProject(updated_project: Project): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/update-project`, updated_project)
      .pipe(
        catchError(error => {
          console.error('Error saving project changes:', error);
          return throwError(() => error);
        })
      );
  }

  public getAllProjects(): Observable<Project[]> {
    return this.http.get<{ projects: Project[] }>(`${this.apiUrl}/get-projects`)
      .pipe(
        map(response => response.projects),
        catchError(error => {
          console.error('Error getting projects:', error);
          return throwError(() => error);
        })
      );
  }

  public getProjectById(projectId: number): Observable<Project> {
    return this.http.get<{ project: Project }>(`${this.apiUrl}/get-project/${projectId}`)
      .pipe(
        map(response => response.project),
        catchError(error => {
          console.error('Error getting project:', error);
          return throwError(() => error);
        })
      );
  }

  public deleteProject(projectId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/remove-project/${projectId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting project:', error);
          return throwError(() => error);
        })
      );
  }

  public addProject(project: ProjectDTO): Observable<Project> {
    return this.http.post<{ added_project: Project }>(`${this.apiUrl}/add-project`,  project)
      .pipe(
        map(response => response.added_project),
        catchError(error => {
          console.error('Error adding project:', error);
          return throwError(() => error);
        })
      );
  }

  public uploadProjectImage(projectId: number, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/update-project-image/${projectId}`, formData)
      .pipe(
        catchError(error => {
          console.error('Error uploading project image:', error);
          return throwError(() => error);
        })
      );
  }
}
