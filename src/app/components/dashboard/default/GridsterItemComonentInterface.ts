// // gridster-item.extensions.ts
// import { GridsterItemComponentInterface } from 'angular-gridster2';
//
// declare module 'angular-gridster2/lib/gridsterItem.interface' {
//     interface GridsterItemComponentInterface {
//         setDraggable(dragEnabled: boolean): void;
//         setResizable(resizeEnabled: boolean): void;
//     }
// }
//
// // Add these methods to GridsterItemComponent's prototype
// GridsterItemComponentInterface.prototype.setDraggable = function(dragEnabled: boolean): void {
//     if (this.$item && this.gridster && this.gridster.options) {
//         const dragAndDrop = this.gridster.options.draggable;
//         if (dragAndDrop) {
//             dragAndDrop.enabled = dragEnabled;
//             this.gridster.options.api.optionsChanged();
//
//             // Update item's internal state
//             if (this.$item) {
//                 this.$item.dragEnabled = dragEnabled;
//             }
//         }
//     }
// };
//
// GridsterItemComponentInterface.prototype.setResizable = function(resizeEnabled: boolean): void {
//     if (this.$item && this.gridster && this.gridster.options) {
//         const resize = this.gridster.options.resizable;
//         if (resize) {
//             resize.enabled = resizeEnabled;
//             this.gridster.options.api.optionsChanged();
//
//             // Update item's internal state
//             if (this.$item) {
//                 this.$item.resizeEnabled = resizeEnabled;
//             }
//         }
//     }
// };
//
// // Usage example:
// /*
//   // In your component:
//   const gridsterItem = this.options.api.getItemComponent(item);
//   if (gridsterItem) {
//     gridsterItem.setDraggable(!isLocked);
//     gridsterItem.setResizable(!isLocked);
//   }
// */
