import {Component, OnInit, TemplateRef, inject, signal, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, catchError, EMPTY } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';
import { getFirestore, collection, CollectionReference, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, DocumentReference, DocumentData, UpdateData } from 'firebase/firestore';

interface RoleData {
  name: string;
  description: string;
}

interface RoleViewModel extends RoleData {
  id: string;
  userCount: number;
}

interface UserData {
  uid: string;
  role?: string;
  [key: string]: any;
}

interface Alert {
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-manager.component.html',
  styleUrls: ['./user-manager.component.scss']
})
export class UserManagerComponent implements OnInit {
  @ViewChild('roleModal', { static: false }) roleModalTemplate!: TemplateRef<any>;

  private auth = inject(Auth);
  private db = getFirestore();
  private fb = inject(FormBuilder);
  private modalService = inject(NgbModal);

  isLoading = signal(false);
  roles = signal<RoleViewModel[]>([]);
  alerts = signal<Alert[]>([]);
  modalTitle = signal('Add New Role');
  editingRole = signal<RoleViewModel | null>(null);
  currentUser = signal<any>(null);

  roleForm: FormGroup;
  private modalRef: NgbModalRef | null = null;

  constructor() {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      canManageContent: [false],
      canManageUsers: [false],
      canManageRoles: [false],
      canManageSettings: [false]
    });

    authState(this.auth)
        .pipe(takeUntilDestroyed())
        .subscribe(user => {
          this.currentUser.set(user);
          if (!user) {
            this.showAlert('You must be logged in to access this page', 'danger');
          } else {
            console.log('User authenticated:', user.uid);
          }
        });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  async loadRoles(): Promise<void> {
    this.isLoading.set(true);
    console.log('Loading roles, current user:', this.currentUser());
    try {
      const rolesCollection = collection(this.db, 'roles') as CollectionReference<RoleData>;
      const rolesSnapshot = await getDocs(rolesCollection);
      const roleViewModels = await Promise.all(
          rolesSnapshot.docs.map(async doc => {
            const data = doc.data() as RoleData;
            const userCount = await this.getUserCountForRole(data.name);
            return {
              id: doc.id,
              name: data.name,
              description: data.description || 'No description provided',
              userCount
            } as RoleViewModel;
          })
      );
      this.roles.set(roleViewModels);
    } catch (error) {
      console.error('Load roles error:', error);
      this.showAlert(`Failed to load roles: ${(error as Error).message}`, 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async getUserCountForRole(roleName: string): Promise<number> {
    try {
      const usersCollection = collection(this.db, 'users');
      const q = query(usersCollection, where('role', '==', roleName));
      const usersSnapshot = await getDocs(q);
      return usersSnapshot.docs.length;
    } catch (error) {
      console.error(`Error fetching user count for role ${roleName}:`, error);
      return 0;
    }
  }

  openAddRoleDialog(): void {
    if (!this.checkAdminPrivileges()) return;
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
    this.modalRef = this.modalService.open(this.roleModalTemplate, { ariaLabelledBy: 'roleModalLabel' });
  }

  openEditRoleDialog(role: RoleViewModel): void {
    if (!this.checkAdminPrivileges()) return;
    this.editingRole.set(role);
    this.modalTitle.set('Edit Role');

    const canManageContent = role.description.includes('content');
    const canManageUsers = role.description.includes('users');
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
    this.modalRef = this.modalService.open(this.roleModalTemplate, { ariaLabelledBy: 'roleModalLabel' });
  }

  closeModal(): void {
    this.modalRef?.dismiss('Cancel click');
  }

  saveRole(): void {
    if (!this.checkAdminPrivileges()) return;

    if (this.roleForm.invalid) {
      Object.keys(this.roleForm.controls).forEach(key => {
        const control = this.roleForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formData = this.roleForm.getRawValue();
    let description = '';
    if (formData.canManageContent) description += 'Can manage content. ';
    if (formData.canManageUsers) description += 'Can manage users. ';
    if (formData.canManageRoles) description += 'Can manage roles. ';
    if (formData.canManageSettings) description += 'Can manage settings. ';

    const roleName = 'ROLE_' + formData.name.toUpperCase().replace(/\s+/g, '_');
    const roleData: RoleData = {
      name: roleName,
      description: description.trim() || formData.description
    };

    this.isLoading.set(true);

    const currentEditingRole = this.editingRole();
    if (currentEditingRole) {
      const roleDoc = doc(this.db, `roles/${currentEditingRole.id}`) as DocumentReference<DocumentData, RoleData>;
      updateDoc(roleDoc, roleData as UpdateData<RoleData>)
          .then(() => {
            this.showAlert('Role updated successfully', 'success');
            this.loadRoles();
            this.modalRef?.close('Save click');
          })
          .catch(error => {
            console.error('Update role error:', error);
            this.showAlert(`Error updating role: ${error.message}`, 'danger');
          })
          .finally(() => this.isLoading.set(false));
    } else {
      const rolesCollection = collection(this.db, 'roles') as CollectionReference<RoleData>;
      addDoc(rolesCollection, roleData)
          .then(() => {
            this.showAlert('Role created successfully', 'success');
            this.loadRoles();
            this.modalRef?.close('Save click');
          })
          .catch(error => {
            console.error('Create role error:', error);
            this.showAlert(`Error creating role: ${error.message}`, 'danger');
          })
          .finally(() => this.isLoading.set(false));
    }
  }

  deleteRole(roleId: string): void {
    if (!this.checkAdminPrivileges()) return;

    if (confirm('Are you sure you want to delete this role?')) {
      this.isLoading.set(true);
      const roleDoc = doc(this.db, `roles/${roleId}`) as DocumentReference<DocumentData, RoleData>;
      deleteDoc(roleDoc)
          .then(() => {
            this.showAlert('Role deleted successfully', 'success');
            this.loadRoles();
          })
          .catch(error => {
            console.error('Delete role error:', error);
            this.showAlert(`Error deleting role: ${error.message}`, 'danger');
          })
          .finally(() => this.isLoading.set(false));
    }
  }

  private async checkAdminPrivileges(): Promise<boolean> {
    const user = this.currentUser();
    if (!user) {
      this.showAlert('You must be logged in to perform this action', 'danger');
      return false;
    }
    return await this.hasAdminRole(user);
  }

  private async hasAdminRole(user: any): Promise<boolean> {
    try {
      const usersCollection = collection(this.db, 'users');
      const q = query(usersCollection, where('uid', '==', user.uid));
      const userDoc = await getDocs(q);
      const userData = userDoc.docs[0]?.data() as UserData | undefined;
      const isAdmin = userData?.['role']?.includes('ADMIN') || false;
      console.log(`User ${user.uid} admin check:`, isAdmin, userData);
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }

  showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const currentAlerts = this.alerts();
    this.alerts.set([...currentAlerts, { message, type }]);
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
