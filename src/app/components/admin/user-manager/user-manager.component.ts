import {Component, OnInit, ViewChild, ElementRef, inject, signal, computed, AfterViewInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule} from '@angular/forms';
import { Modal } from 'bootstrap';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, catchError, EMPTY } from 'rxjs';
import {UserService} from "../../../shared/services/user.service";


interface Alert {
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

interface RoleViewModel {
  id: number;
  name: string;
  description: string;
  userCount: number;
}

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.scss'
})
export class UserManagerComponent implements OnInit, AfterViewInit {
  @ViewChild('roleModal') roleModalElement!: ElementRef;

  // Dependency injection using inject function
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  // UI State
  isLoading = signal(false);
  roles = signal<RoleViewModel[]>([]);
  alerts = signal<Alert[]>([]);
  modalTitle = signal('Add New Role');
  editingRole = signal<RoleViewModel | null>(null);

  // Computed values
  roleCount = computed(() => this.roles().length);

  // Form
  roleForm: FormGroup;

  // Bootstrap modal instance
  private roleModal: Modal | null = null;

  constructor() {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      canManageContent: [false],
      canManageUsers: [false],
      canManageRoles: [false],
      canManageSettings: [false]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  ngAfterViewInit(): void {
    // Initialize the modal using ViewChild reference
    if (this.roleModalElement?.nativeElement) {
      this.roleModal = new Modal(this.roleModalElement.nativeElement);
    }
  }

  loadRoles(): void {
    this.isLoading.set(true);
    this.userService.getRoles()
        .pipe(
            takeUntilDestroyed(),
            finalize(() => this.isLoading.set(false)),
            catchError(error => {
              this.showAlert(`Failed to load roles: ${error.message}`, 'danger');
              return EMPTY;
            })
        )
        .subscribe(data => {
          // Transform API data to view model
          const roleViewModels = data.map(role => ({
            id: role.id,
            name: role.name,
            description: this.generateRoleDescription(role.name),
            userCount: this.getRandomUserCount()
          }));

          this.roles.set(roleViewModels);
        });
  }

  // This is a placeholder - in a real app, you would get the actual user count per role
  private getRandomUserCount(): number {
    return Math.floor(Math.random() * 5);
  }

  // Generate a description based on role name - in a real app, this would come from the server
  private generateRoleDescription(roleName: string): string {
    const descriptions: Record<string, string> = {
      'ROLE_ADMIN': 'Admins can manage the content they have access to',
      'ROLE_EDITOR': 'Editors can manage and publish content',
      'ROLE_SUPER_ADMIN': 'Super Admins can manage all aspects of the system',
      'ROLE_USER': 'Basic user with limited access',
      'ROLE_AUTHOR': 'Authors can create and edit their own content'
    };

    return descriptions[roleName] || 'Default permissions for this role';
  }

  openAddRoleDialog(): void {
    this.editingRole.set(null);
    this.modalTitle.set('Add New Role');

    this.roleForm.reset({
      name: '',
      description: '',
      canManageContent: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false
    });

    if (this.roleModal) {
      this.roleModal.show();
    }
  }

  openEditRoleDialog(role: RoleViewModel): void {
    this.editingRole.set(role);
    this.modalTitle.set('Edit Role');

    // Set form values based on permissions described in the role
    const canManageContent = role.description.includes('content');
    const canManageUsers = role.description.includes('user');
    const canManageRoles = role.name === 'ROLE_SUPER_ADMIN';
    const canManageSettings = role.name === 'ROLE_SUPER_ADMIN' || role.name === 'ROLE_ADMIN';

    this.roleForm.setValue({
      name: role.name.replace('ROLE_', ''),
      description: role.description,
      canManageContent,
      canManageUsers,
      canManageRoles,
      canManageSettings
    });

    if (this.roleModal) {
      this.roleModal.show();
    }
  }

  closeModal(): void {
    if (this.roleModal) {
      this.roleModal.hide();
    }
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      // Mark form controls as touched to trigger validation styles
      Object.keys(this.roleForm.controls).forEach(key => {
        const control = this.roleForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    const formData = this.roleForm.getRawValue();

    // Build description based on permissions
    let description = '';
    if (formData.canManageContent) description += 'Can manage content. ';
    if (formData.canManageUsers) description += 'Can manage users. ';
    if (formData.canManageRoles) description += 'Can manage roles. ';
    if (formData.canManageSettings) description += 'Can manage settings. ';

    // Format role name
    const roleName = 'ROLE_' + formData.name.toUpperCase().replace(/\s+/g, '_');

    const roleData = {
      name: roleName,
      description: description.trim() || formData.description
    };

    this.isLoading.set(true);

    const currentEditingRole = this.editingRole();
    if (currentEditingRole) {
      this.userService.updateRole(currentEditingRole.id, roleData)
          .pipe(
              takeUntilDestroyed(),
              finalize(() => this.isLoading.set(false)),
              catchError(error => {
                this.showAlert(`Error: ${error.message}`, 'danger');
                return EMPTY;
              })
          )
          .subscribe(() => {
            this.showAlert('Role updated successfully', 'success');
            this.loadRoles();
            this.closeModal();
          });
    } else {

      this.userService.createRole(roleData)
          .pipe(
              takeUntilDestroyed(),
              finalize(() => this.isLoading.set(false)),
              catchError(error => {
                this.showAlert(`Error: ${error.message}`, 'danger');
                return EMPTY;
              })
          )
          .subscribe(() => {
            this.showAlert('Role created successfully', 'success');
            this.loadRoles();
            this.closeModal();
          });
    }
  }

  deleteRole(roleId: number): void {
    if (confirm('Are you sure you want to delete this role?')) {
      this.isLoading.set(true);

      this.userService.deleteRole(roleId)
          .pipe(
              takeUntilDestroyed(),
              finalize(() => this.isLoading.set(false)),
              catchError(error => {
                this.showAlert(`Failed to delete role: ${error.message}`, 'danger');
                return EMPTY;
              })
          )
          .subscribe(() => {
            this.showAlert('Role deleted successfully', 'success');
            this.loadRoles();
          });
    }
  }

  // Proper Angular way to show alerts
  showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const currentAlerts = this.alerts();
    this.alerts.set([...currentAlerts, { message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      const updatedAlerts = this.alerts();
      this.alerts.set(updatedAlerts.slice(1));
    }, 5000);
  }

  removeAlert(index: number): void {
    const currentAlerts = this.alerts();
    this.alerts.set([...currentAlerts.slice(0, index), ...currentAlerts.slice(index + 1)]);
  }
}
