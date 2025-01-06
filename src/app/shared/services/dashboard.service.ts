import {Injectable, Type, ComponentFactoryResolver, ViewContainerRef, OnInit} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {ResizableContainerComponent} from "../../resizable-container/resizable-container.component";
import {GridsterItem} from "angular-gridster2";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private componentRegistry = new Map<string, Type<any>>([
    ['ComponentA', ResizableContainerComponent],
    ['ComponentB', ResizableContainerComponent]
  ]);

  getComponent(name: string): Type<any> | undefined {
    return this.componentRegistry.get(name);
  }
}


