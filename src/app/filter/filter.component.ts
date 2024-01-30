import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent {
  

  @Input()
  showRecentSearches!: boolean;
  @Output() filterEvent = new EventEmitter<string>();
  @Output() toggleRecentSearchesEvent = new EventEmitter<void>();


  applyFilter(filterValue: string) {
    // Emit the filter event to the parent component with the input value
    this.filterEvent.emit(filterValue);
  }



  toggleRecentSearches() {
    // Emit the toggle event to the parent component
    this.toggleRecentSearchesEvent.emit();
  }
}